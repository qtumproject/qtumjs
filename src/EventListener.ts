import { EventEmitter } from "eventemitter3"

import { QtumRPC, IQtumRPCGetLogsRequest } from "./QtumRPC"
import { ContractLogDecoder } from "./abi"
import {
  IQtumContractEventLogs,
  IQtumContractEventLog,
  IEthContractEventLog
} from "./Contract"
import { IPromiseCancel } from "./rpcCommonTypes"
import { EthRPC, IEthRPCGetLogsRequest } from "./EthRPC"
import { sleep } from "./sleep"

export type ICancelFunction = () => void

export interface ICancellableEventEmitter extends EventEmitter {
  cancel: ICancelFunction
}

const ETH_HALF_ESTIMATED_AVERAGE_BLOCK_TIME = 7500

export class EventListener<TypeRPC extends QtumRPC | EthRPC> {
  // TODO filter out unparseable logs

  constructor(private rpc: TypeRPC, private logDecoder: ContractLogDecoder) {}

  /**
   * Get contract event logs. Long-poll wait if no log is found. Returns a cancel
   * function that stops the events subscription.
   *
   * @param req (optional) IRPCWaitForLogsRequest
   */
  public getLogs(
    req: TypeRPC extends QtumRPC
      ? IQtumRPCGetLogsRequest
      : IEthRPCGetLogsRequest = {} as any
  ): IPromiseCancel<
    TypeRPC extends QtumRPC ? IQtumContractEventLogs : IEthContractEventLog[]
  > {
    const { rpc } = this
    if (rpc instanceof QtumRPC) {
      const reqTypeSafe = req as IQtumRPCGetLogsRequest

      const logPromise = rpc.getLogs(reqTypeSafe)
      return logPromise.then((result) => {
        const entries = result.entries.map((entry) => {
          const parsedLog = this.logDecoder.decode(entry)
          return {
            ...entry,
            event: parsedLog
          }
        })

        const resultTypeSafe: IQtumContractEventLogs = {
          ...result,
          entries
        }
        return resultTypeSafe
      }) as any
    } else if (rpc instanceof EthRPC) {
      const reqTypeSafe = req as IEthRPCGetLogsRequest

      const logPromise = rpc.getLogs(reqTypeSafe)
      return logPromise.then((result) => {
        const entries = result.map((entry) => {
          const parsedLog = this.logDecoder.decode(entry)
          return {
            ...entry,
            event: parsedLog
          }
        })

        const resultTypeSafe: IEthContractEventLog[] = entries
        return resultTypeSafe
      }) as any
    } else {
      throw new Error("Unsupported rpc type")
    }
  }

  /**
   * Subscribe to contract's events, using callback interface.
   */
  public onLog(
    fn: (
      entry: TypeRPC extends QtumRPC
        ? IQtumContractEventLog
        : IEthContractEventLog
    ) => void,
    opts: TypeRPC extends QtumRPC
      ? IQtumRPCGetLogsRequest
      : IEthRPCGetLogsRequest = {} as any
  ): ICancelFunction {
    let fromBlock = opts.fromBlock || "latest"
    let toBlock = opts.toBlock || "latest"

    let promiseCancel: (() => void)
    let canceled = false
    let latestBlockNum: number
    let isFirstFetch = true
    const { rpc } = this
    const isEth = rpc instanceof EthRPC
    const fetchToLatest = typeof fromBlock !== "number"

    const asyncLoop = async () => {
      while (!canceled) {
        latestBlockNum = await rpc.getBlockNumber()

        if (isEth) {
          if (typeof fromBlock !== "number") {
            fromBlock = latestBlockNum
          }

          if (fetchToLatest) {
            toBlock = latestBlockNum
          }

          if (
            fromBlock > toBlock ||
            (!isFirstFetch && fromBlock === toBlock)
          ) {
            await sleep(ETH_HALF_ESTIMATED_AVERAGE_BLOCK_TIME)
            continue
          }

          if (isFirstFetch) {
            isFirstFetch = false
          }
        } else {
          // qtum waitforlogs will throw `Incorrect params(code: -8)`
          // if `fromBlock > toBlock` (including `toBlock === "latest"`)
          // therefor we need to make sure block `fromBlock` is mined
          if (
            typeof fromBlock === "number" &&
            fromBlock > latestBlockNum
          ) {
            await sleep(300)
            continue
          }
        }

        const logPromise = this.getLogs({
          ...(opts as any),
          fromBlock,
          toBlock
        })

        promiseCancel = logPromise.cancel

        const result = await logPromise

        if (isEth) {
          const resultTypeSafe = result as IEthContractEventLog[]
          for (const entry of resultTypeSafe) {
            fn(entry as any)
          }

          fromBlock = latestBlockNum + 1
        } else {
          const resultTypeSafe = result as IQtumContractEventLogs
          for (const entry of resultTypeSafe.entries) {
            fn(entry as any)
          }
          fromBlock = resultTypeSafe.nextblock
        }
      }
    }

    asyncLoop()

    // return a cancel function
    return () => {
      canceled = true
      if (promiseCancel) {
        promiseCancel()
      }
    }
  }

  /**
   * Subscribe to contract's events, use EventsEmitter interface.
   */
  public emitter(
    opts: TypeRPC extends QtumRPC
      ? IQtumRPCGetLogsRequest
      : IEthRPCGetLogsRequest = {} as any
  ): ICancellableEventEmitter {
    const emitter = new EventEmitter()

    const cancel = this.onLog((entry) => {
      const key = (entry.event && entry.event.type) || "?"
      emitter.emit(key, entry)
    }, opts)

    return Object.assign(emitter, {
      cancel
    })
  }
}
