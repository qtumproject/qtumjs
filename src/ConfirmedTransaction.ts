import {
  IRPCGetTransactionReceiptResult,
  IRPCGetTransactionResult,
} from "./QtumRPC"

export class ConfirmedTransaction {
  // implements IRPCGetTransactionResult

  constructor(
    public tx: IRPCGetTransactionResult,
    public receipt: IRPCGetTransactionReceiptResult,
  ) {
  }
}
