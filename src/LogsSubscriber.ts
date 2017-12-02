import { EventEmitter } from "eventemitter3"

import {
  ILogEntry,
  IRPCWaitForLogsRequest,
  QtumRPC,
} from "./QtumRPC"

const LOGEVENT = "log"

export class LogsSubscriber {
  private _emitter: EventEmitter

  constructor(
    private _rpc: QtumRPC,
    private _waitReq: IRPCWaitForLogsRequest = {},
  ) {
    this._emitter = new EventEmitter()
  }

  /**
   * async loop to long-poll for new logs
   */
  public async start() {
    let curblock = this._waitReq.from
    while (true) {
      const result = await this._rpc.waitforlogs({
        ...this._waitReq,
        from: curblock,
      })

      // advance log cursor
      curblock = result.nextblock

      if (result.count < 1) {
        continue
      }

      for (const log of result.entries) {
        this._emitter.emit(LOGEVENT, log)
      }
    }
  }

  public on(fn: (log: ILogEntry) => void): void {
    this._emitter.on(LOGEVENT, fn)
  }

  public once(fn: (log: ILogEntry) => void): void {
    this._emitter.once(LOGEVENT, fn)
  }

  public off(fn: (log: ILogEntry) => void): void {
    this._emitter.off(LOGEVENT, fn)
  }
}
