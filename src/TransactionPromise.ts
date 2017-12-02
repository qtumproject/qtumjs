import {
  encodeInputs,
} from "./abi"
import {
  Contract,
  IContractSendRequestOptions,
} from "./Contract"
import {
  IABIMethod,
} from "./ethjs-abi"

import { ConfirmedTransaction } from "./ConfirmedTransaction"

import {
  IRPCGetTransactionReceiptResult,
  IRPCGetTransactionRequest,
  IRPCGetTransactionResult,
  IRPCSendToContractResult,
  QtumRPC,
} from "./QtumRPC"

import { sleep } from "./sleep"

export class TransactionPromise {
  public calldata: string

  private sent: boolean = false
  private txid: string

  constructor(
    private rpc: QtumRPC,
    public contract: Contract,
    public methodABI: IABIMethod,
    public params: any[],
    private opts: IContractSendRequestOptions,
  ) {
    this.calldata = encodeInputs(methodABI, params)
  }

  public async exec() {
    // only send the transaction request once
    if (this.sent) {
      return
    }

    this.sent = true
    const { txid } = await this.rpc.sendToContract({
      address: this.contract.address,
      datahex: this.calldata,
      ...this.opts,
    })

    this.txid = txid
  }

  public then<T>(onfulfilled: (tx: ConfirmedTransaction) => T, reject: (err: any) => void) {
    return this.exec().then(async () => {
      const tx = await this.confirm(1)
      return tx
    }).then(onfulfilled).catch(reject)
  }

  /**
   * Returns a transaction object that had been confirmed at least n times
   */
  public async confirm(
    nConfirms: number = 3,
    timeout: number = 3000,
    txUpdated?: (tx: ConfirmedTransaction) => void): Promise<ConfirmedTransaction> {

    const hasTxWaitSupport = await this.rpc.checkTransactionWaitSupport()

    // TODO: a way to notify if tx had been added to wallet (after getTransaction returns)

    // if hasTxWaitSupport, make one long-poll per confirmation
    let confirmations = 1
    // if !hasTxWaitSupport, poll every interval until tx.confirmations increased
    let lastConfirmation = 0

    while (true) {
      const req: IRPCGetTransactionRequest = { txid: this.txid }

      if (hasTxWaitSupport) {
        req.waitconf = confirmations
      }

      const tx = await this.rpc.getTransaction(req)

      if (tx.confirmations > 0) {
        const receipt = await this.rpc.getTransactionReceipt({ txid: tx.txid })

        if (!receipt) {
          throw new Error("Cannot get transaction receipt")
        }

        const ctx = new ConfirmedTransaction(this.contract.info.abi, tx, receipt)
        if (txUpdated && tx.confirmations > lastConfirmation) {
          // confirmation increased since last check
          confirmations = tx.confirmations
          txUpdated(ctx)
        }

        if (tx.confirmations >= nConfirms) {
          // reached number of required confirmations. done
          return ctx
        }
      }

      lastConfirmation = tx.confirmations

      if (hasTxWaitSupport) {
        // long-poll for one additional confirmation
        confirmations++
      } else {
        await sleep(timeout + Math.random() * 200)
      }
    }
  }
}
