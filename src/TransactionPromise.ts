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

  public then<T>(onfulfilled: (tx: ConfirmedTransaction) => T) {
    return this.exec().then(async () => {
      const tx = await this.confirm(1)
      return tx
    })
  }

  /**
   * Returns a transaction object that had been confirmed at least n times
   */
  public async confirm(
    nblock: number = 3,
    timeout: number = 3000,
    txUpdated?: (tx: ConfirmedTransaction) => void): Promise<ConfirmedTransaction> {

    let confirmations = -1
    while (true) {
      const tx = await this.rpc.getTransaction({ txid: this.txid })

      if (tx.confirmations > 0) {
        const receipt = await this.rpc.getTransactionReceipt({ txid: tx.txid })

        if (!receipt) {
          throw new Error("Cannot get transaction receipt")
        }

        const ctx = new ConfirmedTransaction(tx, receipt)
        if (txUpdated && tx.confirmations > confirmations) {
          confirmations = tx.confirmations
          txUpdated(ctx)
        }

        if (tx.confirmations >= nblock) {
          return ctx
        }
      }

      await sleep(timeout + Math.random() * 200)
    }
  }
}
