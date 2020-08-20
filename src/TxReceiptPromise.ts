import { EventEmitter } from "eventemitter3"

import {
  IRPCGetTransactionReceiptResult,
  IRPCGetTransactionRequest,
  IRPCGetTransactionResult,
  QtumRPC,
} from "./QtumRPC"
import { sleep } from "./sleep"

export type TxReceiptConfirmationHandler = (
  tx: IRPCGetTransactionResult,
  receipt: IRPCGetTransactionReceiptResult,
) => any

const EVENT_CONFIRM = "confirm"

// tslint:disable-next-line:no-empty-interface
export interface ITxReceiptConfirmOptions {
  pollInterval?: number
}

export class TxReceiptPromise {
  private _emitter: EventEmitter

  constructor(private _rpc: QtumRPC, public txid: string) {
    this._emitter = new EventEmitter()
  }

  // TODO should return parsed logs with the receipt
  public async confirm(
    confirm: number = 6,
    opts: ITxReceiptConfirmOptions = {},
  ): Promise<IRPCGetTransactionReceiptResult> {
    const minconf = confirm
    const pollInterval = opts.pollInterval || 3000

    const hasTxWaitSupport = await this._rpc.checkTransactionWaitSupport()

    // if hasTxWaitSupport, make one long-poll per confirmation
    let curConfirmation = 1
    // if !hasTxWaitSupport, poll every interval until tx.confirmations increased
    let lastConfirmation = 0

    while (true) {
      const req: IRPCGetTransactionRequest = { txid: this.txid }

      if (hasTxWaitSupport) {
        req.waitconf = curConfirmation
      }

      const tx = await this._rpc.getTransaction(req)

      if (tx.confirmations > 0) {
        const receipt = await this._rpc.getTransactionReceipt({ txid: tx.txid })

        if (!receipt) {
          throw new Error("Cannot get transaction receipt")
        }

        // TODO augment receipt2 with parsed logs
        const receipt2 = receipt

        // const ctx = new ConfirmedTransaction(this.contract.info.abi, tx, receipt)

        if (tx.confirmations > lastConfirmation) {
          // confirmation increased since last check
          curConfirmation = tx.confirmations
          this._emitter.emit(EVENT_CONFIRM, tx, receipt2)
          // TODO emit update event
          // txUpdated(ctx)
        }

        if (tx.confirmations >= minconf) {
          // reached number of required confirmations. done
          return receipt2
        }
      }

      lastConfirmation = tx.confirmations

      if (hasTxWaitSupport) {
        // long-poll for one additional confirmation
        curConfirmation++
      } else {
        await sleep(pollInterval + Math.random() * 200)
      }
    }
  }

  public onConfirm(fn: TxReceiptConfirmationHandler) {
    this._emitter.on(EVENT_CONFIRM, fn)
  }

  public offConfirm(fn: TxReceiptConfirmationHandler) {
    this._emitter.off(EVENT_CONFIRM, fn)
  }
}
