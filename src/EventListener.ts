import { EventEmitter } from "eventemitter3"

import { QtumRPC, IRPCWaitForLogsRequest } from "./QtumRPC"
import { ContractLogDecoder } from "./abi"
import { IContractEventLogs, IContractEventLog } from "./Contract"

export class EventListener {
  // TODO filter out unparseable logs

  constructor(private rpc: QtumRPC, private logDecoder: ContractLogDecoder) {
  }

  /**
   * Get contract event logs. Long-poll wait if no log is found.
   * @param req (optional) IRPCWaitForLogsRequest
   */
  public async waitLogs(req: IRPCWaitForLogsRequest = {}): Promise<IContractEventLogs> {
    const filter = req.filter || {}

    const result = await this.rpc.waitforlogs({
      ...req,
      filter,
    })

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
  }

  /**
   * Subscribe to contract's events, using callback interface.
   */
  public onLog(fn: (entry: IContractEventLog) => void, opts: IRPCWaitForLogsRequest = {}) {
    let nextblock = opts.fromBlock || "latest"

    const loop = async () => {
      while (true) {
        const result = await this.waitLogs({
          ...opts,
          fromBlock: nextblock,
        })

        for (const entry of result.entries) {
          fn(entry)
        }

        nextblock = result.nextblock
      }
    }

    loop()
  }

  /**
   * Subscribe to contract's events, use EventsEmitter interface.
   */
  public logEmitter(opts: IRPCWaitForLogsRequest = {}): EventEmitter {
    const emitter = new EventEmitter()

    this.onLog((entry) => {
      const key = (entry.event && entry.event.type) || "?"
      emitter.emit(key, entry)
    }, opts)

    return emitter
  }

}
