import { EventEmitter } from "eventemitter3"

import { QtumRPC, IRPCWaitForLogsRequest, IPromiseCancel } from "./QtumRPC"
import { ContractLogDecoder } from "./abi"
import { IContractEventLogs, IContractEventLog } from "./Contract"

export type ICancelFunction = () => void

export interface ICancellableEventEmitter extends EventEmitter {
  cancel: ICancelFunction
}

export class EventListener {
  // TODO filter out unparseable logs

  constructor(private rpc: QtumRPC, private logDecoder: ContractLogDecoder) {}

  /**
   * Get contract event logs. Long-poll wait if no log is found. Returns a cancel
   * function that stops the events subscription.
   *
   * @param req (optional) IRPCWaitForLogsRequest
   */
  public waitLogs(
    req: IRPCWaitForLogsRequest = {},
  ): IPromiseCancel<IContractEventLogs> {
    const filter = req.filter || {}

    const logPromise = this.rpc.waitforlogs({
      ...req,
      filter,
    })

    return logPromise.then((result) => {
      const entries = result.entries.map((entry) => {
        const parsedLog = this.logDecoder.decode(entry)
        return {
          ...entry,
          event: parsedLog,
        }
      })

      return {
        ...result,
        entries,
      }
    }) as any // bypass typechecker problem
  }

  /**
   * Subscribe to contract's events, using callback interface.
   */
  public onLog(
    fn: (entry: IContractEventLog) => void,
    opts: IRPCWaitForLogsRequest = {},
  ): ICancelFunction {
    let nextblock = opts.fromBlock || "latest"

    let promiseCancel: () => void
    let canceled = false

    const asyncLoop = async () => {
      while (true) {
        if (canceled) {
          break
        }

        const logPromise = this.waitLogs({
          ...opts,
          fromBlock: nextblock,
        })

        promiseCancel = logPromise.cancel

        const result = await logPromise

        for (const entry of result.entries) {
          fn(entry)
        }

        nextblock = result.nextblock
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
  public emitter(opts: IRPCWaitForLogsRequest = {}): ICancellableEventEmitter {
    const emitter = new EventEmitter()

    const cancel = this.onLog((entry) => {
      const key = (entry.event && entry.event.type) || "?"
      emitter.emit(key, entry)
    }, opts)

    return Object.assign(emitter, {
      cancel,
    })
  }
}
