import { EventEmitter } from "eventemitter3"

import {
  IQtumRPCGetTransactionReceiptResult,
  IQtumRPCGetTransactionRequest,
  IQtumRPCGetTransactionResult,
  QtumRPC
} from "./QtumRPC"
import { sleep } from "./sleep"
import {
  EthRPC,
  IEthRPCGetTransactionResult,
  IEthRPCGetTransactionReceiptResult,
  ETH_TRANSACTION_STATUS
} from "./EthRPC"

export type QtumTxReceiptConfirmationHandler = (
  tx: IQtumRPCGetTransactionResult,
  receipt: IQtumRPCGetTransactionReceiptResult
) => any

export type EthTxReceiptConfirmationHandler = (
  tx: IEthRPCGetTransactionResult,
  receipt: IEthRPCGetTransactionReceiptResult
) => any

const EVENT_CONFIRM = "confirm"

const HALF_ESTIMATED_AVERAGE_BLOCK_TIME = 7500

// tslint:disable-next-line:no-empty-interface
export interface ITxReceiptConfirmOptions {
  pollInterval?: number
}

export class TxReceiptPromise<TypeRPC extends QtumRPC | EthRPC> {
  private _emitter: EventEmitter

  constructor(private _rpc: TypeRPC, public txid: string) {
    this._emitter = new EventEmitter()
  }

  // TODO should return parsed logs with the receipt
  public async confirm(
    confirm: number = 6,
    opts: ITxReceiptConfirmOptions = {}
  ): Promise<
    TypeRPC extends QtumRPC
      ? IQtumRPCGetTransactionReceiptResult
      : IEthRPCGetTransactionReceiptResult
  > {
    const minconf = confirm
    const pollInterval = opts.pollInterval || 3000

    const { _rpc: rpc } = this
    const hasTxWaitSupport =
      rpc instanceof QtumRPC && (await rpc.checkTransactionWaitSupport())

    // if hasTxWaitSupport, make one long-poll per confirmation
    let curConfirmation = 1
    // if !hasTxWaitSupport, poll every interval until tx.confirmations increased
    let lastConfirmation = 0

    while (true) {
      const req: IQtumRPCGetTransactionRequest = { txid: this.txid }

      if (hasTxWaitSupport) {
        req.waitconf = curConfirmation
      }

      let tx: IQtumRPCGetTransactionResult | IEthRPCGetTransactionResult | null
      if (rpc instanceof QtumRPC) {
        tx = await rpc.getTransaction(req)
      } else if (rpc instanceof EthRPC) {
        tx = await rpc.getTransaction(req.txid)
        if (tx == null) {
          throw new Error(`Cannot find transaction(${tx}`)
        }
        return this.confirmEth(tx, confirm, opts) as any
      } else {
        throw new Error("unsupported rpc type")
      }

      if (tx.confirmations > 0) {
        const receipt = await rpc.getTransactionReceipt({ txid: tx.txid })

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
          this._emitter.removeAllListeners(EVENT_CONFIRM)
          return receipt2 as any
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

  public onConfirm(
    fn: TypeRPC extends QtumRPC
      ? QtumTxReceiptConfirmationHandler
      : EthTxReceiptConfirmationHandler
  ) {
    this._emitter.on(EVENT_CONFIRM, fn)
  }

  public offConfirm(
    fn: TypeRPC extends QtumRPC
      ? QtumTxReceiptConfirmationHandler
      : EthTxReceiptConfirmationHandler
  ) {
    this._emitter.off(EVENT_CONFIRM, fn)
  }

  private async confirmEth(
    tx: IEthRPCGetTransactionResult,
    requiredConfirmation: number = 6,
    opts: ITxReceiptConfirmOptions = {}
  ): Promise<IEthRPCGetTransactionReceiptResult> {
    const { txid } = this
    const { pollInterval = HALF_ESTIMATED_AVERAGE_BLOCK_TIME } = opts

    const rpc = this._rpc as EthRPC
    let prevConfirmationCounter = 0

    while (true) {
      const receipt = await rpc.getTransactionReceipt(txid)
      const currentBlockNumber = await rpc.getBlockNumber()

      // not yet confirmed or is pending
      if (receipt == null) {
        await sleep(pollInterval)
        continue
      }

      const hasTransactionError =
        receipt.status != null &&
        Number(receipt.status) === ETH_TRANSACTION_STATUS.FAILED
      if (hasTransactionError) {
        throw new Error("Transaction process error")
      }

      const receiptBlockNumber = receipt.blockNumber

      const confirmationCounter = currentBlockNumber - receiptBlockNumber
      if (confirmationCounter === 0 && requiredConfirmation > 0) {
        // ignore fresh receipt
        await sleep(pollInterval)
        continue
      }

      if (confirmationCounter < requiredConfirmation) {
        // wait for more confirmations
        let confirmationCount = 1
        if (confirmationCounter !== prevConfirmationCounter) {
          confirmationCount = confirmationCounter - prevConfirmationCounter
          prevConfirmationCounter = confirmationCount
        }

        for (let i = 0; i < confirmationCount; i++) {
          this._emitter.emit(EVENT_CONFIRM, tx, receipt)
        }

        await sleep(pollInterval)
        continue
      }

      // enough confirmation, success
      this._emitter.removeAllListeners(EVENT_CONFIRM)
      return receipt
    }
  }
}
