import {
  IRPCSendToContractResult,
  QtumRPC,
} from "./QtumRPC"

import { sleep } from "./sleep"

export class ContractSendReceipt {
  public txid: string
  public sender: string
  public hash160: string

  constructor(private rpc: QtumRPC, sendResult: IRPCSendToContractResult) {
    Object.assign(this, sendResult)
  }

  /**
   * Check whether a transaction had been confirmed by n blocks.
   */
  public async check(nblock: number = 3): Promise<boolean> {
    const tx = await this.rpc.getTransaction({ txid: this.txid })
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

      await sleep(timeout)
    }
  }
}
