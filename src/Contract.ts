import { IABIMethod } from "./ethjs-abi"
import { EventEmitter } from "eventemitter3"

import {
  decodeOutputs,
  encodeInputs,
  ContractLogDecoder,
  IDecodedSolidityEvent
} from "./abi"

import {
  IQtumRPCCallResult,
  IQtumRPCGetTransactionReceiptBase,
  IQtumRPCGetTransactionReceiptResult,
  IQtumRPCGetTransactionResult,
  QtumRPC,
  IRPCWaitForLogsRequest,
  ILogEntry,
  IQtumRPCSendTransactionResult
} from "./QtumRPC"

import { TxReceiptPromise } from "./TxReceiptPromise"

import { MethodMap } from "./MethodMap"
import {
  EthRPC,
  IEthRPCGetTransactionResult,
  IEthRPCGetTransactionReceiptBase,
  IEthRPCSendTransactionResult,
  IEthRPCGetTransactionReceiptResult
} from "./EthRPC"
import { ITransactionLog } from "./rpcCommonTypes"

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * The callback function invoked for each additional confirmation
 */
export type IQtumContractSendConfirmationHandler = (
  tx: IQtumRPCGetTransactionResult,
  receipt: IQtumTransactionReceipt
) => any

/**
 * The callback function invoked for each additional confirmation
 */
export type IEthContractSendConfirmationHandler = (
  tx: IEthRPCGetTransactionResult,
  receipt: IEthTransactionReceipt
) => any

/**
 * @param n Number of confirmations to wait for
 * @param handler The callback function invoked for each additional confirmation
 */
export type IQtumContractSendConfirmFunction = (
  n?: number,
  handler?: IQtumContractSendConfirmationHandler
) => Promise<IQtumTransactionReceipt>

/**
 * @param n Number of confirmations to wait for
 * @param handler The callback function invoked for each additional confirmation
 */
export type IEthContractSendConfirmFunction = (
  n?: number,
  handler?: IEthContractSendConfirmationHandler
) => Promise<IEthTransactionReceipt>

/**
 * Result of contract send.
 */
export interface IQtumContractSendResult extends IQtumRPCGetTransactionResult {
  /**
   * Name of contract method invoked.
   */
  method: string

  /**
   * Wait for transaction confirmations.
   */
  confirm: IQtumContractSendConfirmFunction
}

/**
 * Result of contract send.
 */
export interface IEthContractSendResult extends IEthRPCGetTransactionResult {
  /**
   * Name of contract method invoked.
   */
  method: string

  /**
   * Wait for transaction confirmations.
   */
  confirm: IEthContractSendConfirmFunction
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
export interface ICallResult<T> {
  /**
   * ABI-decoded outputs
   */
  outputs: any[]

  /**
   * ABI-decoded logs
   */
  logs: Array<IDecodedSolidityEvent | null>

  rawResult: T extends QtumRPC ? IQtumRPCCallResult : string
}

/**
 * Options for `send` to a contract method.
 */
export interface IContractSendRequestOptions<T> {
  /**
   * The amount in QTUM to send. eg 0.1, default: 0
   */
  value?: number | string

  /**
   * gasLimit, default: 200000, max: 40000000
   */
  gasLimit?: number

  /**
   * Qtum price per gas unit, default: 0.00000001, min:0.00000001
   */
  gasPrice?: number | string

  /**
   * The quantum/ethereum address that will be used as sender.
   */
  from?: string

  nonce?: T extends QtumRPC ? undefined : number
}

/**
 * Options for `call` to a contract method.
 */
export interface IContractCallRequestOptions<T> {
  /**
   * The quantum/ethereum address that will be used as sender.
   */
  from?: string

  gasLimit?: T extends QtumRPC ? undefined : (string | number)
  gasPrice?: T extends QtumRPC ? undefined : (string | number)
  value?: T extends QtumRPC ? undefined : (string | number)
  blockNumber?: T extends QtumRPC ? undefined : (string | number)
}

/**
 * The transaction receipt for a `send` to a contract method, with the event
 * logs decoded.
 */
export interface IEthTransactionReceipt
  extends IEthRPCGetTransactionReceiptBase {
  /**
   * logs decoded using ABI
   */
  logs: IDecodedSolidityEvent[]

  /**
   * undecoded logs
   */
  rawlogs: ITransactionLog[]
}

/**
 * The transaction receipt for a `send` to a contract method, with the event
 * logs decoded.
 */
export interface IQtumTransactionReceipt
  extends IQtumRPCGetTransactionReceiptBase {
  /**
   * logs decoded using ABI
   */
  logs: IDecodedSolidityEvent[]

  /**
   * undecoded logs
   */
  rawlogs: ITransactionLog[]
}

export interface IEthTransactionReceipt
  extends IEthRPCGetTransactionReceiptBase {
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
export class Contract<TypeRPC extends QtumRPC | EthRPC> {
  /**
   * The contract's address as hex160
   */
  public address: string

  private methodMap: MethodMap
  private _logDecoder: ContractLogDecoder
  // private _useBigNumber: boolean

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
    private rpc: TypeRPC,
    public info: IContractInfo,
    opts: IContractInitOptions = {}
  ) {
    this.methodMap = new MethodMap(info.abi)
    this.address = info.address

    this._logDecoder =
      opts.logDecoder ||
      new ContractLogDecoder(this.info.abi, this.rpc instanceof QtumRPC)

    // this._useBigNumber = false
  }

  public encodeParams(method: string, args: any[] = []): string {
    const methodABI = this.methodMap.findMethod(method, args)
    if (!methodABI) {
      throw new Error(`Unknown method to call: ${method}`)
    }

    return encodeInputs(methodABI, args, this.rpc instanceof QtumRPC)
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
    opts: IContractCallRequestOptions<TypeRPC> = {}
  ): Promise<TypeRPC extends QtumRPC ? IQtumRPCCallResult : string> {
    const calldata = this.encodeParams(method, args)
    const { rpc } = this

    if (rpc instanceof QtumRPC) {
      const options = opts as IContractCallRequestOptions<QtumRPC>
      const req = {
        ...options,
        from: options.from || this.info.sender,
        to: this.address,
        data: calldata
      }

      const resultTypeSafe: IQtumRPCCallResult = await rpc.call(req)
      return resultTypeSafe as any
    }

    if (rpc instanceof EthRPC) {
      const options = opts as IContractCallRequestOptions<EthRPC>
      const req = {
        ...options,
        to: this.address,
        data: calldata
      }

      const resultTypeSafe: string = await rpc.call(req)
      return resultTypeSafe as any
    }

    throw new Error("Unsupported rpc type")
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
    opts: IContractCallRequestOptions<TypeRPC> = {}
  ): Promise<ICallResult<TypeRPC>> {
    const callResult = await this.rawCall(method, args, opts)

    let output = callResult as string
    const decodedLogs: Array<IDecodedSolidityEvent | null> = []
    if (typeof callResult !== "string") {
      const callResultTypeSafe = callResult as IQtumRPCCallResult
      const exception = callResultTypeSafe.executionResult.excepted
      if (exception !== "None") {
        throw new Error(`Call exception: ${exception}`)
      }

      output = callResultTypeSafe.executionResult.output

      callResultTypeSafe.transactionReceipt.log.forEach((rawLog) => {
        decodedLogs.push(this._logDecoder.decode(rawLog))
      })
    }

    let decodedOutputs = []
    if (output !== "") {
      const methodABI = this.methodMap.findMethod(method, args)!
      decodedOutputs = decodeOutputs(
        methodABI,
        output,
        this.rpc instanceof QtumRPC
      )
    }

    return {
      rawResult: callResult,
      outputs: decodedOutputs,
      logs: decodedLogs
    }
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
    opts: IContractCallRequestOptions<TypeRPC> = {}
  ): Promise<any> {
    const result = await this.call(method, args, opts)
    return result.outputs[0]
  }

  public async returnNumber(
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions<TypeRPC> = {}
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
    opts: IContractCallRequestOptions<TypeRPC> = {}
  ): Promise<Date> {
    const result = await this.return(method, args, opts)
    if (typeof result !== "number") {
      throw Error(
        "Cannot convert return value to Date. Expect return value to be a number."
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
    opts: IContractCallRequestOptions<TypeRPC> = {}
  ): Promise<number> {
    const value = await this.return(method, args, opts)

    if (typeof value !== "number") {
      throw Error(
        "Cannot convert return value to currency unit. Expect return value to be a number."
      )
    }

    let base: number = 0

    if (typeof targetBase === "number") {
      base = targetBase
    } else {
      // TODO: support ethereum unit
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

  public async returnAs<Type>(
    converter: (val: any) => Type | Promise<Type>,
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions<TypeRPC> = {}
  ): Promise<Type> {
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
    opts: IContractSendRequestOptions<TypeRPC> = {}
  ): Promise<
    TypeRPC extends QtumRPC
      ? IQtumRPCSendTransactionResult
      : IEthRPCSendTransactionResult
  > {
    // TODO opts: gas limit, gas price, sender address
    const methodABI = this.methodMap.findMethod(method, args)
    if (methodABI == null) {
      throw new Error(`Unknown method to send: ${method}`)
    }

    if (methodABI.constant) {
      throw new Error(`Cannot send to a constant method: ${method}`)
    }

    const calldata = encodeInputs(methodABI, args, this.rpc instanceof QtumRPC)
    const { rpc } = this

    if (rpc instanceof QtumRPC) {
      const options = opts as IContractSendRequestOptions<QtumRPC>
      const req = {
        ...options,
        to: this.address,
        data: calldata,
        from: options.from || this.info.sender
      }

      const resultTypeSafe: IQtumRPCSendTransactionResult = await rpc.sendTransaction(
        req
      )
      return resultTypeSafe as any
    }

    if (rpc instanceof EthRPC) {
      const options = opts as IContractSendRequestOptions<EthRPC>
      const req = {
        ...options,
        to: this.address,
        data: calldata
      }

      const resultTypeSafe: IEthRPCSendTransactionResult = await rpc.sendTransaction(
        req
      )
      return resultTypeSafe as any
    }

    throw new Error("Unsupported rpc type")
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
    onConfirm?: TypeRPC extends QtumRPC
      ? IQtumContractSendConfirmationHandler
      : IEthContractSendConfirmationHandler
  ): Promise<IQtumTransactionReceipt> {
    const { rpc } = this

    if (rpc instanceof QtumRPC) {
      const txrp = new TxReceiptPromise<QtumRPC>(rpc, txid)
      if (onConfirm) {
        txrp.onConfirm((tx2, receipt2) => {
          const sendTxReceipt = this._makeSendTxReceipt(receipt2 as any)
          const onConfirmTypeSafe = onConfirm as IQtumContractSendConfirmationHandler
          onConfirmTypeSafe(tx2, sendTxReceipt as IQtumTransactionReceipt)
        })
      }

      const receipt = await txrp.confirm(confirm)

      return this._makeSendTxReceipt(receipt as any) as any
    }

    if (rpc instanceof EthRPC) {
      const txrp = new TxReceiptPromise<EthRPC>(rpc, txid)
      if (onConfirm) {
        txrp.onConfirm((tx2, receipt2) => {
          const sendTxReceipt = this._makeSendTxReceipt(receipt2 as any)
          const onConfirmTypeSafe = onConfirm as IEthContractSendConfirmationHandler
          onConfirmTypeSafe(tx2, sendTxReceipt as IEthTransactionReceipt)
        })
      }

      const receipt = await txrp.confirm(confirm)

      return this._makeSendTxReceipt(receipt as any) as any
    }

    throw new Error("Unsupported rpc type")
  }

  /**
   * Returns the receipt for a transaction, with decoded event logs.
   *
   * @param txid transaction id. Must be an in-wallet transaction
   * @returns The receipt, or null if transaction is not yet confirmed.
   */
  public async receipt(
    txid: string
  ): Promise<
    TypeRPC extends QtumRPC
      ? (IQtumTransactionReceipt | null)
      : (IEthTransactionReceipt | null)
  > {
    const { rpc } = this
    if (rpc instanceof QtumRPC) {
      const receipt = await rpc.getTransactionReceipt({ txid })
      if (!receipt) {
        return null as any
      }

      return this._makeSendTxReceipt(receipt as any) as any
    }

    if (rpc instanceof EthRPC) {
      const receipt = await rpc.getTransactionReceipt(txid)
      if (!receipt) {
        return null as any
      }

      return this._makeSendTxReceipt(receipt as any) as any
    }

    throw new Error("Unsupported rpc type")
  }

  public async send(
    method: string,
    args: any[] = [],
    opts: IContractSendRequestOptions<TypeRPC> = {}
  ): Promise<
    TypeRPC extends QtumRPC ? IQtumContractSendResult : IEthContractSendResult
  > {
    const methodABI = this.methodMap.findMethod(method, args)
    if (methodABI == null) {
      throw new Error(`Unknown method to send: ${method}`)
    }

    if (methodABI.constant) {
      throw new Error(`cannot send to a constant method: ${method}`)
    }

    const calldata = encodeInputs(methodABI, args, this.rpc instanceof QtumRPC)

    let sentResult: IQtumRPCSendTransactionResult | IEthRPCSendTransactionResult
    let txid: string
    let transaction: IQtumRPCGetTransactionResult | IEthRPCGetTransactionResult
    const { rpc } = this
    if (rpc instanceof QtumRPC) {
      const options = opts as IContractSendRequestOptions<QtumRPC>
      sentResult = await rpc.sendTransaction({
        ...options,
        from: options.from || this.info.sender,
        to: this.address,
        data: calldata
      })

      txid = sentResult.txid
      transaction = await rpc.getTransaction({ txid })
    } else if (rpc instanceof EthRPC) {
      const options = opts as IContractSendRequestOptions<EthRPC>
      sentResult = await rpc.sendTransaction({
        ...options,
        data: calldata,
        to: this.address
      })

      txid = sentResult.txid
      transaction = (await rpc.getTransaction(txid))!
    } else {
      throw new Error("Unsupported rpc type")
    }

    const confirm = (n: number, handler?: any) => this.confirm(txid, n, handler)

    const sendTx = {
      ...transaction,
      method,
      confirm
    }

    return sendTx as any
  }

  /**
   * Get contract event logs, up to the latest block. By default, it starts looking
   * for logs from the beginning of the blockchain.
   * @param req
   */
  public async logs(
    req: IRPCWaitForLogsRequest = {}
  ): Promise<IContractEventLogs> {
    return this.waitLogs({
      fromBlock: 0,
      toBlock: "latest",
      ...req
    })
  }

  /**
   * Get contract event logs. Long-poll wait if no log is found.
   * @param req (optional) IRPCWaitForLogsRequest
   */
  public async waitLogs(
    req: IRPCWaitForLogsRequest = {}
  ): Promise<IContractEventLogs> {
    const filter = req.filter || {}
    if (!filter.addresses) {
      filter.addresses = [this.address]
    }

    const result = await (this.rpc as QtumRPC).waitforlogs({
      ...req,
      filter
    })

    const entries = result.entries.map((entry) => {
      const parsedLog = this.logDecoder.decode(entry)
      return {
        ...entry,
        event: parsedLog
      }
    })

    return {
      ...result,
      entries
    }
  }

  /**
   * Subscribe to contract's events, using callback interface.
   */
  public onLog(
    fn: (entry: IContractEventLog) => void,
    opts: IRPCWaitForLogsRequest = {}
  ) {
    let nextblock = opts.fromBlock || "latest"

    const loop = async () => {
      while (true) {
        const result = await this.waitLogs({
          ...opts,
          fromBlock: nextblock
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
    receipt: TypeRPC extends QtumRPC
      ? IQtumRPCGetTransactionReceiptResult
      : IEthRPCGetTransactionReceiptResult
  ): TypeRPC extends QtumRPC
    ? IQtumTransactionReceipt
    : IEthTransactionReceipt {
    // https://stackoverflow.com/a/34710102
    // ...receiptNoLog will be a copy of receipt, without the `log` property

    const { rpc } = this
    let rawlogs: ITransactionLog[]
    let receiptNoLog:
      | Omit<IQtumRPCGetTransactionReceiptResult, "log">
      | Omit<IEthRPCGetTransactionReceiptResult, "logs">
    if (rpc instanceof QtumRPC) {
      const {
        log,
        ...receiptWithoutLog
      } = receipt as IQtumRPCGetTransactionReceiptResult
      rawlogs = log
      receiptNoLog = receiptWithoutLog
    } else if (rpc instanceof EthRPC) {
      const {
        logs: _rawlogs,
        ...receiptWithoutLog
      } = receipt as IEthRPCGetTransactionReceiptResult
      rawlogs = _rawlogs
      receiptNoLog = receiptWithoutLog
    } else {
      throw new Error("Unsupported rpc type")
    }

    const logs = rawlogs.map((rawLog) => this.logDecoder.decode(rawLog)!)

    return {
      ...receiptNoLog,
      logs,
      rawlogs
    } as any
  }
}
