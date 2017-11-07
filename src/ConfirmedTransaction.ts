import {
  IRPCGetTransactionReceiptResult,
  IRPCGetTransactionResult,
} from "./QtumRPC"

import {
  IABIMethod,
} from "./ethjs-abi"

import {
  decodeLogs,
  IDecodedLog,
} from "./abi"

export class ConfirmedTransaction {
  // implements IRPCGetTransactionResult

  public logs: IDecodedLog[]

  constructor(
    private methods: IABIMethod[],
    public tx: IRPCGetTransactionResult,
    public receipt: IRPCGetTransactionReceiptResult,
  ) {
    this.logs = decodeLogs(this.methods, this.receipt.log)
  }
}
