import { IABIMethod, IETHABI } from "./ethjs-abi"

import {
  decodeLogs,
  decodeOutputs,
  encodeInputs,
} from "./abi"

import { IDecodedLog, ITransactionLog } from "./index"
import {
  IExecutionResult,
  IRPCCallContractResult,
  IRPCGetTransactionReceiptBase,
  IRPCGetTransactionReceiptResult,
  IRPCGetTransactionResult,
  IRPCSendToContractResult,
  QtumRPC,
} from "./QtumRPC"
import {
  TxReceiptConfirmationHandler,
  TxReceiptPromise,
} from "./TxReceiptPromise"

export interface IContractSendTx {
  method: string
  txid: string
}

export type IContractSendTxConfirmationHandler = (
  tx: IRPCGetTransactionResult,
  receipt: IContractSendTxReceipt,
) => any

export type IContractSendTxConfirmFunction = (n?: number, handler?: IContractSendTxConfirmationHandler) => any

export interface IContractSendTxConfirmable extends IRPCGetTransactionResult {
  method: string
  confirm: IContractSendTxConfirmFunction,
}

export interface IContractInfo {
  /**
   * Contract ABI methods
   */
  abi: IABIMethod[]
  /**
   * Address of contract
   */
  address: string

  // name: string
  // deployName: string
  // txid: string
  // bin: string
  // binhash: string
  // createdAt: string // date string
  // confirmed: boolean

  sender: string
}

export interface IContractCallDecodedResult extends IRPCCallContractResult {
  outputs: any[]
  // [key: number]: any
}

export interface IContractSendRequestOptions {
  /**
   * The amount in QTUM to send. eg 0.1, default: 0
   */
  amount?: number | string

  /**
   * gasLimit, default: 200000, max: 40000000
   */
  gasLimit?: number

  /**
   * Qtum price per gas unit, default: 0.00000001, min:0.00000001
   */
  gasPrice?: number | string

  /**
   * The quantum address that will be used as sender.
   */
  senderAddress?: string
}

export interface IContractCallRequestOptions {
  /**
   * The quantum address that will be used as sender.
   */
  senderAddress?: string
}

export interface IContractSendTxReceipt extends IRPCGetTransactionReceiptBase {
  /**
   * logs decoded using ABI
   */
  logs: IDecodedLog[],

  /**
   * undecoded logs
   */
  rawlogs: ITransactionLog[],
}

export class Contract {

  // private abi: IABI[]
  public address: string
  private callMethodsMap: { [key: string]: IABIMethod } = {}
  private sendMethodsMap: { [key: string]: IABIMethod } = {}

  constructor(private rpc: QtumRPC, public info: IContractInfo) {
    for (const methodABI of info.abi) {
      const name = methodABI.name

      // Allow sendToContract only for non-constant methods
      if (!methodABI.constant) {
        this.sendMethodsMap[name] = methodABI
      }

      this.callMethodsMap[name] = methodABI
    }

    this.address = info.address
  }

  public encodeParams(method: string, args: any[] = []): string {
    const methodABI = this.callMethodsMap[method]
    if (methodABI == null) {
      throw new Error(`Unknown method to call: ${method}`)
    }

    return encodeInputs(methodABI, args)
  }

  /**
   * Call a contract method using ABI encoding, and return the RPC result as is. This
   * does not create a transaction. It is useful for gas estimation or getting results from
   * read-only methods.
   *
   * @param method name of contract method to call
   * @param args arguments
   */
  public async rawCall(
    method: string, args: any[] = [],
    opts: IContractCallRequestOptions = {}):
    Promise<IRPCCallContractResult> {
    // TODO opts: sender address

    // need to strip the leading "0x"
    const calldata = this.encodeParams(method, args)

    // TODO decode?
    return this.rpc.callContrct({
      address: this.address,
      datahex: calldata,
      senderAddress: this.info.sender,
      ...opts,
    })
  }

  public async call(
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions = {}):
    Promise<IContractCallDecodedResult> {
    // TODO support the named return values mechanism for decodeParams

    const r = await this.rawCall(method, args, opts)

    const exception = r.executionResult.excepted
    if (exception !== "None") {
      throw new Error(`Call exception: ${exception}`)
    }

    const output = r.executionResult.output

    let decodedOutputs = []
    if (output !== "") {
      const methodABI = this.callMethodsMap[method]
      decodedOutputs = decodeOutputs(methodABI, output)
    }

    return Object.assign(r, {
      outputs: decodedOutputs,
    })
  }

  /**
   * Create a transaction that calls a method using ABI encoding, and return the RPC result as is.
   * A transaction will require network consensus to confirm, and costs you gas.
   *
   * @param method name of contract method to call
   * @param args arguments
   */
  public async rawSend(
    method: string,
    args: any[],
    opts: IContractSendRequestOptions = {}):
    Promise<IRPCSendToContractResult> {
    // TODO opts: gas limit, gas price, sender address
    const methodABI = this.sendMethodsMap[method]
    if (methodABI == null) {
      throw new Error(`Unknown method to send: ${method}`)
    }

    const calldata = encodeInputs(methodABI, args)

    return this.rpc.sendToContract({
      address: this.address,
      datahex: calldata,
      senderAddress: this.info.sender,
      ...opts,
    })
  }

  public async confirm(
    tx: IContractSendTx,
    confirm?: number,
    onConfirm?: IContractSendTxConfirmationHandler,
  ): Promise<IContractSendTxReceipt> {
    const txrp = new TxReceiptPromise(this.rpc, tx.txid)

    if (onConfirm) {
      txrp.onConfirm((tx2, receipt2) => {
        const sendTxReceipt = this._makeSendTxReceipt(receipt2)
        onConfirm(tx2, sendTxReceipt)
      })
    }

    const receipt = await txrp.confirm(confirm)

    return this._makeSendTxReceipt(receipt)
  }

  public async send(
    method: string,
    args: any[],
    opts: IContractSendRequestOptions = {},
  ): Promise<IContractSendTxConfirmable> {
    const methodABI = this.sendMethodsMap[method]

    if (methodABI == null) {
      throw new Error(`Unknown method to send: ${method}`)
    }

    const calldata = encodeInputs(methodABI, args)

    const sent = await this.rpc.sendToContract({
      datahex: calldata,
      address: this.address,
      senderAddress: this.info.sender,
      ...opts,
    })

    const txid = sent.txid

    const txinfo = await this.rpc.getTransaction({txid})

    const sendTx = {
      ...txinfo,
      method,
      confirm: (n?: number, handler?: IContractSendTxConfirmationHandler) => {
        return this.confirm(sendTx, n, handler)
      },
    }

    return sendTx
  }

  private _makeSendTxReceipt(receipt: IRPCGetTransactionReceiptResult): IContractSendTxReceipt {
    // https://stackoverflow.com/a/34710102
    // ...receiptNoLog will be a copy of receipt, without the `log` property
    const {log: rawlogs, ...receiptNoLog} = receipt
    const logs = decodeLogs(this.info.abi, rawlogs)

    return {
      ...receiptNoLog,
      logs,
      rawlogs,
    }
  }
}
