import { EventEmitter } from "eventemitter3"

import { QtumRPC, IRPCWaitForLogsRequest, IPromiseCancel } from "./QtumRPC"
import { ContractLogDecoder } from "./abi"
import { IContractEventLogs, IContractEventLog } from "./Contract"

export type ICancelFunction = () => void

export class EventListener {
  // TODO filter out unparseable logs

  constructor(private rpc: QtumRPC, private logDecoder: ContractLogDecoder) {
  }

  /**
   * Get contract event logs. Long-poll wait if no log is found.
   * @param req (optional) IRPCWaitForLogsRequest
   */
  public waitLogs(req: IRPCWaitForLogsRequest = {}): IPromiseCancel<IContractEventLogs> {
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
  public onLog(fn: (entry: IContractEventLog) => void, opts: IRPCWaitForLogsRequest = {}): ICancelFunction {
    let nextblock = opts.fromBlock || "latest"

    let promiseCancel: (() => void)
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
  public emitter(opts: IRPCWaitForLogsRequest = {}): EventEmitter {
    const emitter = new EventEmitter()

    this.onLog((entry) => {
      const key = (entry.event && entry.event.type) || "?"
      emitter.emit(key, entry)
    }, opts)

    return emitter
  }

}
