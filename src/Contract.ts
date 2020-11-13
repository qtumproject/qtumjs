import { IABIMethod, IETHABI, LogDecoder } from "./ethjs-abi"
import { EventEmitter } from "eventemitter3"

import debug from "debug"

const log = debug("qtumjs:contract")

const { logDecoder } = require("qtumjs-ethjs-abi") as IETHABI

import { decodeOutputs, encodeInputs, ContractLogDecoder } from "./abi"

import {
  IDecodedSolidityEvent,
  ITransactionLog,
  IRPCSearchLogsRequest,
} from "./index"
import {
  IExecutionResult,
  IRPCCallContractResult,
  IRPCGetTransactionReceiptBase,
  IRPCGetTransactionReceiptResult,
  IRPCGetTransactionResult,
  IRPCSendToContractResult,
  IRPCWaitForLogsResult,
  QtumRPC,
  IRPCWaitForLogsRequest,
  ILogEntry,
} from "./QtumRPC"

import {
  TxReceiptConfirmationHandler,
  TxReceiptPromise,
} from "./TxReceiptPromise"

import { MethodMap } from "./MethodMap"

export interface IContractSendTx {
  method: string
  txid: string
}

/**
 * The callback function invoked for each additional confirmation
 */
export type IContractSendConfirmationHandler = (
  tx: IRPCGetTransactionResult,
  receipt: IContractSendReceipt,
) => any

/**
 * @param n Number of confirmations to wait for
 * @param handler The callback function invoked for each additional confirmation
 */
export type IContractSendConfirmFunction = (
  n?: number,
  handler?: IContractSendConfirmationHandler,
) => Promise<IContractSendReceipt>

/**
 * Result of contract send.
 */
export interface IContractSendResult extends IRPCGetTransactionResult {
  /**
   * Name of contract method invoked.
   */
  method: string

  /**
   * Wait for transaction confirmations.
   */
  confirm: IContractSendConfirmFunction
}

/**
 * The minimal deployment information necessary to interact with a
 * deployed contract.
 */
export interface IContractInfo {
  /**
   * Contract's ABI definitions, produced by solc.
   */
  abi: IABIMethod[]

  /**
   * Contract's address
   */
  address: string

  /**
   * The owner address of the contract
   */
  sender?: string
}

/**
 * Deployment information stored by solar
 */
export interface IDeployedContractInfo extends IContractInfo {
  name: string
  deployName: string
  txid: string
  bin: string
  binhash: string
  createdAt: string // date string
  confirmed: boolean
}

/**
 * The result of calling a contract method, with decoded outputs.
 */
export interface IContractCallResult extends IRPCCallContractResult {
  /**
   * ABI-decoded outputs
   */
  outputs: any[]

  /**
   * ABI-decoded logs
   */
  logs: (IDecodedSolidityEvent | null)[]
}

/**
 * Options for `send` to a contract method.
 */
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

/**
 * Options for `call` to a contract method.
 */
export interface IContractCallRequestOptions {
  /**
   * The quantum address that will be used as sender.
   */
  senderAddress?: string
  gasLimit?: number
  amount?: number
}

/**
 * The transaction receipt for a `send` to a contract method, with the event
 * logs decoded.
 */
export interface IContractSendReceipt extends IRPCGetTransactionReceiptBase {
  /**
   * logs decoded using ABI
   */
  logs: IDecodedSolidityEvent[]

  /**
   * undecoded logs
   */
  rawlogs: ITransactionLog[]
}

export interface IContractLog<T> extends ILogEntry {
  event: T
}

/**
 * A decoded contract event log.
 */
export interface IContractEventLog extends ILogEntry {
  /**
   * Solidity event, ABI decoded. Null if no ABI definition is found.
   */
  event?: IDecodedSolidityEvent | null
}

/**
 * Query result of a contract's event logs.
 */
export interface IContractEventLogs {
  /**
   * Event logs, ABI decoded.
   */
  entries: IContractEventLog[]

  /**
   * Number of event logs returned.
   */
  count: number

  /**
   * The block number to start query for new event logs.
   */
  nextblock: number
}

export interface IContractInitOptions {
  /**
   * event logs decoder. It may know how to decode logs not whose types are not
   * defined in this particular contract's `info`. Typically ContractsRepo would
   * pass in a logDecoder that knows about all the event definitions.
   */
  logDecoder?: ContractLogDecoder

  /**
   * If a contract's use case requires numbers more than 53 bits, use bn.js to
   * represent numbers instead of native JavaScript numbers. (default = false)
   */
  useBigNumber?: boolean
}

/**
 * Contract represents a Smart Contract deployed on the blockchain.
 */
export class Contract {
  /**
   * The contract's address as hex160
   */
  public address: string

  private methodMap: MethodMap
  private _logDecoder: ContractLogDecoder
  private _useBigNumber: boolean

  /**
   * Create a Contract
   *
   * @param rpc - The RPC object used to access the blockchain.
   * @param info - The deployment information about this contract generated by
   *      [solar](https://github.com/qtumproject/solar). It includes the contract
   *      address, owner address, and ABI definition for methods and types.
   * @param opts - init options
   */
  constructor(
    private rpc: QtumRPC,
    public info: IContractInfo,
    opts: IContractInitOptions = {},
  ) {
    this.methodMap = new MethodMap(info.abi)
    this.address = info.address

    this._logDecoder = opts.logDecoder || new ContractLogDecoder(this.info.abi)

    this._useBigNumber = false
  }

  public encodeParams(method: string, args: any[] = []): string {
    const methodABI = this.methodMap.findMethod(method, args)
    if (!methodABI) {
      throw new Error(`Unknown method to call: ${method}`)
    }

    return encodeInputs(methodABI, args)
  }

  /**
   * Call a contract method using ABI encoding, and return the RPC result as is.
   * This does not create a transaction. It is useful for gas estimation or
   * getting results from read-only methods.
   *
   * @param method name of contract method to call
   * @param args arguments
   */
  public async rawCall(
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions = {},
  ): Promise<IRPCCallContractResult> {
    log("call", method, args, opts)

    const calldata = this.encodeParams(method, args)

    return this.rpc.callContract({
      address: this.address,
      datahex: calldata,
      senderAddress: opts.senderAddress || this.info.sender,
      ...opts,
    })
  }

  /**
   * Executes contract method on your own local qtumd node as a "simulation"
   * using `callcontract`. It is free, and does not actually modify the
   * blockchain.
   *
   * @param method Name of the contract method
   * @param args Arguments for calling the method
   * @param opts call options
   */
  public async call(
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions = {},
  ): Promise<IContractCallResult> {
    const r = await this.rawCall(method, args, opts)

    // console.log("call result", r)

    const exception = r.executionResult.excepted
    if (exception !== "None") {
      throw new Error(`Call exception: ${exception}`)
    }

    const output = r.executionResult.output

    let decodedOutputs = []
    if (output !== "") {
      const methodABI = this.methodMap.findMethod(method, args)!
      decodedOutputs = decodeOutputs(methodABI, output)
    }

    const decodedLogs = r.transactionReceipt.log.map((rawLog) => {
      return this.logDecoder.decode(rawLog)
    })

    return Object.assign(r, {
      outputs: decodedOutputs,
      logs: decodedLogs,
    })
  }

  /**
   * Call a method, and return only the first return value of the method. This
   * is a convenient syntatic sugar to get the return value when there is only
   * one.
   *
   * @param method Name of the contract method
   * @param args Arguments for calling the method
   * @param opts call options
   */
  public async return(
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions = {},
  ): Promise<any> {
    const result = await this.call(method, args, opts)
    return result.outputs[0]
  }

  public async returnNumber(
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions = {},
  ): Promise<number> {
    const result = await this.call(method, args, opts)
    const val = result.outputs[0]

    // Convert big number to JavaScript number
    if (typeof val.toNumber !== "function") {
      throw new Error("Cannot convert result to a number")
    }

    return val.toNumber()
  }

  /**
   * Call a method, and return the first return value as Date. It is assumed
   * that the returned value is unix second.
   *
   * @param method
   * @param args
   * @param opts
   */
  public async returnDate(
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions = {},
  ): Promise<Date> {
    const result = await this.return(method, args, opts)
    if (typeof result !== "number") {
      throw Error(
        "Cannot convert return value to Date. Expect return value to be a number.",
      )
    }

    return new Date(result * 1000)
  }

  /**
   * Call a method, and return the first return value (a uint). Convert the value to
   * the desired currency unit.
   *
   * @param targetBase The currency unit to convert to. If a number, it is
   * treated as the power of 10. -8 is satoshi. 0 is the canonical unit.
   * @param method
   * @param args
   * @param opts
   */
  public async returnCurrency(
    targetBase: number | string,
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions = {},
  ): Promise<number> {
    const value = await this.return(method, args, opts)

    if (typeof value !== "number") {
      throw Error(
        "Cannot convert return value to currency unit. Expect return value to be a number.",
      )
    }

    let base: number = 0

    if (typeof targetBase === "number") {
      base = targetBase
    } else {
      switch (targetBase) {
        case "qtum":
        case "btc":
          base = 0
          break
        case "sat":
        case "satoshi":
          base = -8
        default:
          throw Error(`Unknown base currency unit: ${targetBase}`)
      }
    }

    const satoshi = 1e-8

    return (value * satoshi) / 10 ** base
  }

  public async returnAs<T>(
    converter: (val: any) => T | Promise<T>,
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions = {},
  ): Promise<T> {
    const value = await this.return(method, args, opts)
    return await converter(value)
  }

  /**
   * Create a transaction that calls a method using ABI encoding, and return the
   * RPC result as is. A transaction will require network consensus to confirm,
   * and costs you gas.
   *
   * @param method name of contract method to call
   * @param args arguments
   */
  public async rawSend(
    method: string,
    args: any[],
    opts: IContractSendRequestOptions = {},
  ): Promise<IRPCSendToContractResult> {
    // TODO opts: gas limit, gas price, sender address
    const methodABI = this.methodMap.findMethod(method, args)
    if (methodABI == null) {
      throw new Error(`Unknown method to send: ${method}`)
    }

    if (methodABI.constant) {
      throw new Error(`cannot send to a constant method: ${method}`)
    }

    const calldata = encodeInputs(methodABI, args)

    return this.rpc.sendToContract({
      address: this.address,
      datahex: calldata,
      senderAddress: opts.senderAddress || this.info.sender,
      ...opts,
    })
  }

  /**
   * Confirms an in-wallet transaction, and return the receipt.
   *
   * @param txid transaction id. Must be an in-wallet transaction
   * @param confirm how many confirmations to ensure
   * @param onConfirm callback that receives the receipt for each additional confirmation
   */
  public async confirm(
    txid: string,
    confirm?: number,
    onConfirm?: IContractSendConfirmationHandler,
  ): Promise<IContractSendReceipt> {
    const txrp = new TxReceiptPromise(this.rpc, txid)

    if (onConfirm) {
      txrp.onConfirm((tx2, receipt2) => {
        const sendTxReceipt = this._makeSendTxReceipt(receipt2)
        onConfirm(tx2, sendTxReceipt)
      })
    }

    const receipt = await txrp.confirm(confirm)

    return this._makeSendTxReceipt(receipt)
  }

  /**
   * Returns the receipt for a transaction, with decoded event logs.
   *
   * @param txid transaction id. Must be an in-wallet transaction
   * @returns The receipt, or null if transaction is not yet confirmed.
   */
  public async receipt(txid: string): Promise<IContractSendReceipt | null> {
    const receipt = await this.rpc.getTransactionReceipt({ txid })
    if (!receipt) {
      return null
    }

    return this._makeSendTxReceipt(receipt)
  }

  public async send(
    method: string,
    args: any[] = [],
    opts: IContractSendRequestOptions = {},
  ): Promise<IContractSendResult> {
    log("send", method, args, opts)
    const methodABI = this.methodMap.findMethod(method, args)
    if (methodABI == null) {
      throw new Error(`Unknown method to send: ${method}`)
    }

    if (methodABI.constant) {
      throw new Error(`cannot send to a constant method: ${method}`)
    }

    const calldata = encodeInputs(methodABI, args)

    const sent = await this.rpc.sendToContract({
      datahex: calldata,
      address: this.address,
      senderAddress: opts.senderAddress || this.info.sender,
      ...opts,
    })

    const txid = sent.txid

    const txinfo = await this.rpc.getTransaction({ txid })

    const sendTx = {
      ...txinfo,
      method,
      confirm: (n?: number, handler?: IContractSendConfirmationHandler) => {
        return this.confirm(txid, n, handler)
      },
    }

    return sendTx
  }

  /**
   * Get contract event logs, up to the latest block. By default, it starts looking
   * for logs from the beginning of the blockchain.
   * @param req
   */
  public async logs(
    req: IRPCWaitForLogsRequest = {},
  ): Promise<IContractEventLogs> {
    return this.waitLogs({
      fromBlock: 0,
      toBlock: "latest",
      ...req,
    })
  }

  /**
   * Get contract event logs. Long-poll wait if no log is found.
   * @param req (optional) IRPCWaitForLogsRequest
   */
  public async waitLogs(
    req: IRPCWaitForLogsRequest = {},
  ): Promise<IContractEventLogs> {
    const filter = req.filter || {}
    if (!filter.addresses) {
      filter.addresses = [this.address]
    }

    const result = await this.rpc.waitforlogs({
      ...req,
      filter,
    })

    const entries = result.entries.map((entry) => {
      const parsedLog = this.logDecoder.decode(entry)
      return {
        ...entry,
        event: parsedLog,
      }
    })

    return {
      ...result,
      entries,
    }
  }

  /**
   * Subscribe to contract's events, using callback interface.
   */
  public onLog(
    fn: (entry: IContractEventLog) => void,
    opts: IRPCWaitForLogsRequest = {},
  ) {
    let nextblock = opts.fromBlock || "latest"

    const loop = async () => {
      while (true) {
        const result = await this.waitLogs({
          ...opts,
          fromBlock: nextblock,
        })

        for (const entry of result.entries) {
          fn(entry)
        }

        nextblock = result.nextblock
      }
    }

    loop()
  }

  /**
   * Subscribe to contract's events, use EventsEmitter interface.
   */
  public logEmitter(opts: IRPCWaitForLogsRequest = {}): EventEmitter {
    const emitter = new EventEmitter()

    this.onLog((entry) => {
      const key = (entry.event && entry.event.type) || "?"
      emitter.emit(key, entry)
    }, opts)

    return emitter
  }

  private get logDecoder(): ContractLogDecoder {
    return this._logDecoder
  }

  private _makeSendTxReceipt(
    receipt: IRPCGetTransactionReceiptResult,
  ): IContractSendReceipt {
    // https://stackoverflow.com/a/34710102
    // ...receiptNoLog will be a copy of receipt, without the `log` property
    const { log: rawlogs, ...receiptNoLog } = receipt
    const logs = rawlogs.map((rawLog) => this.logDecoder.decode(rawLog)!)

    return {
      ...receiptNoLog,
      logs,
      rawlogs,
    }
  }
}
