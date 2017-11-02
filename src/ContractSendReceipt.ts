import {
  IRPCGetTransactionResult,
  IRPCSendToContractResult,
  QtumRPC,
} from "./QtumRPC"

import { sleep } from "./sleep"

export class ContractSendReceipt {
  public txid: string
  public sender: string
  public hash160: string

  // the latest transaction object
  public tx?: IRPCGetTransactionResult

  constructor(private rpc: QtumRPC, sendResult: IRPCSendToContractResult) {
    Object.assign(this, sendResult)
  }

  /**
   * Returns a transaction object that had been confirmed at least n times
   */
  public async confirm(
    nblock: number = 3,
    timeout: number = 3000,
    txUpdated?: (tx: IRPCGetTransactionResult) => void): Promise<IRPCGetTransactionResult> {

    if (this.tx && this.tx.confirmations > nblock) {
      return this.tx
    }

    // if this.confirmed >
    while (true) {
      const tx = await this.rpc.getTransaction({ txid: this.txid })

      // update transaction if is newer
      if (this.tx === undefined || tx.confirmations > this.tx.confirmations) {
        this.tx = tx
        if (txUpdated) {
          txUpdated(tx)
        }
      }

      if (tx.confirmations >= nblock) {
        return tx
      }

      await sleep(timeout + Math.random() * 200)
    }
  }

  /**
   * Check whether a transaction had been confirmed by n blocks.
   */
  public async check(nblock: number = 3): Promise<boolean> {
    const tx = await this.rpc.getTransaction({ txid: this.txid })
    if (this.tx === undefined || tx.confirmations > this.tx.confirmations) {
      this.tx = tx
    }
    return tx.confirmations >= nblock
  }

  /**
   * Repeatedly checks a transaction for confirmation.
   */
  public async done(nblock: number = 3, timeout: number = 3000): Promise<void> {
    while (true) {
      const isConfirmed = await this.check(nblock)
      if (isConfirmed) {
        break
      }

      await sleep(timeout + Math.random() * 200)
    }
  }
}
