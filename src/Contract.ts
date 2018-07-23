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
  IQtumRPCGetLogsRequest,
  IQtumLogEntry,
  IQtumRPCSendTransactionResult
} from "./QtumRPC"

import { TxReceiptPromise } from "./TxReceiptPromise"

import { MethodMap } from "./MethodMap"
import {
  EthRPC,
  IEthRPCGetTransactionResult,
  IEthRPCGetTransactionReceiptBase,
  IEthRPCSendTransactionResult,
  IEthRPCGetTransactionReceiptResult,
  typeBlockTags,
  IEthLogEntry,
  IEthRPCGetLogsRequest
} from "./EthRPC"
import { ITransactionLog } from "./rpcCommonTypes"
import { sleep } from "./sleep"
import { ICancelFunction, ICancellableEventEmitter } from "./EventListener"

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
export interface ICallResult<T extends QtumRPC | EthRPC> {
  /**
   * ABI-decoded outputs
   */
  outputs: any[]

  /**
   * ABI-decoded logs
   * note: ethereum call result will not contain any logs
   */
  logs: Array<IDecodedSolidityEvent | null>

  rawResult: T extends QtumRPC ? IQtumRPCCallResult : string
}

/**
 * Options for `send` to a contract method.
 */
export interface IContractSendRequestOptions<T extends QtumRPC | EthRPC> {
  /**
   * The amount in QTUM to send. eg 0.1, default: 0
   */
  value?: number | string

  /**
   * gasLimit, default: 200000, max: 40000000
   */
  gasLimit?: number | string

  /**
   * Qtum price per gas unit, default: 0.00000001, min:0.00000001
   */
  gasPrice?: number | string

  /**
   * The quantum/ethereum address that will be used as sender.
   */
  from?: string

  nonce?: T extends QtumRPC ? undefined : (number | string)
}

/**
 * Options for `call` to a contract method.
 */
export interface IContractCallRequestOptions<T extends QtumRPC | EthRPC> {
  /**
   * The quantum/ethereum address that will be used as sender.
   */
  from?: string

  gasLimit?: T extends QtumRPC ? undefined : (string | number)
  gasPrice?: T extends QtumRPC ? undefined : (string | number)
  value?: T extends QtumRPC ? undefined : (string | number)
  blockNumber?: T extends QtumRPC ? undefined : typeBlockTags
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

export interface IContractLog<T> extends IQtumLogEntry {
  event: T
}

/**
 * A decoded contract event log.
 */
export interface IQtumContractEventLog extends IQtumLogEntry {
  /**
   * Solidity event, ABI decoded. Null if no ABI definition is found.
   */
  event?: IDecodedSolidityEvent | null
}

/**
 * A decoded contract event log.
 */
export interface IEthContractEventLog extends IEthLogEntry {
  /**
   * Solidity event, ABI decoded. Null if no ABI definition is found.
   */
  event?: IDecodedSolidityEvent | null
}

/**
 * Query result of a contract's event logs.
 */
export interface IQtumContractEventLogs {
  /**
   * Event logs, ABI decoded.
   */
  entries: IQtumContractEventLog[]

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

const ETH_HALF_ESTIMATED_AVERAGE_BLOCK_TIME = 7500

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
   * treated as the power of 10.
   * In Qtum, -8 is satoshi, 0 is the canonical unit.
   * In Ethereum, 0 is wei, 9 is gwei, 18 is ether, etc.
   * @param method
   * @param args
   * @param opts
   */
  public async returnCurrency(
    targetBase: TypeRPC extends QtumRPC
      ? number | "qtum" | "btc" | "sat" | "satoshi"
      : (
          | number
          | "ether"
          | "milliether"
          | "finney"
          | "microether"
          | "szabo"
          | "gwei"
          | "shannon"
          | "mwei"
          | "lovelace"
          | "kwei"
          | "babbage"
          | "wei"),
    method: string,
    args: any[] = [],
    opts: IContractCallRequestOptions<TypeRPC> = {}
  ): Promise<number> {
    let value = await this.return(method, args, opts)

    if (typeof value === "object" && typeof value.toNumber === "function") {
      value = value.toNumber()
    }

    if (typeof value !== "number") {
      throw Error(
        "Cannot convert return value to currency unit. Expect return value to be a number."
      )
    }

    let base: number = 0

    if (typeof targetBase === "number") {
      base = targetBase
    } else {
      switch (targetBase) {
        // qtum units
        case "qtum":
        case "btc":
          base = 0
          break
        case "sat":
        case "satoshi":
          base = -8
          break
        // ethereum units
        case "ether":
          base = 18
          break
        case "milliether":
        case "finney":
          base = 15
          break
        case "microether":
        case "szabo":
          base = 12
          break
        case "gwei":
        case "shannon":
          base = 9
          break
        case "mwei":
        case "lovelace":
          base = 6
          break
        case "kwei":
        case "babbage":
          base = 3
          break
        case "wei":
          base = 0
          break
        default:
          throw Error(`Unknown base currency unit: ${targetBase}`)
      }
    }

    const { rpc } = this
    if (rpc instanceof QtumRPC) {
      const satoshi = 1e-8

      return (value * satoshi) / 10 ** base
    }

    if (rpc instanceof EthRPC) {
      return value * 10 ** base
    }

    throw new Error("Unsupported rpc type")
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

    let txid: string
    let transaction: IQtumRPCGetTransactionResult | IEthRPCGetTransactionResult
    const { rpc } = this
    if (rpc instanceof QtumRPC) {
      const options = opts as IContractSendRequestOptions<QtumRPC>
      const sentResult = await rpc.sendTransaction({
        ...options,
        from: options.from || this.info.sender,
        to: this.address,
        data: calldata
      })

      txid = sentResult.txid
      transaction = await rpc.getTransaction({ txid })
    } else if (rpc instanceof EthRPC) {
      const options = opts as IContractSendRequestOptions<EthRPC>
      const sentResult = await rpc.sendTransaction({
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
    req: TypeRPC extends QtumRPC
      ? IQtumRPCGetLogsRequest
      : IEthRPCGetLogsRequest = {} as any
  ): Promise<
    TypeRPC extends QtumRPC ? IQtumContractEventLogs : IEthContractEventLog[]
  > {
    return this.getLogs({
      fromBlock: 0,
      toBlock: "latest",
      ...(req as any)
    })
  }

  /**
   * Get contract event logs. Long-poll wait if no log is found.
   * @param req (optional) IRPCWaitForLogsRequest
   */
  public async getLogs(
    req: TypeRPC extends QtumRPC
      ? IQtumRPCGetLogsRequest
      : IEthRPCGetLogsRequest = {} as any
  ): Promise<
    TypeRPC extends QtumRPC ? IQtumContractEventLogs : IEthContractEventLog[]
  > {
    const { rpc } = this
    if (rpc instanceof QtumRPC) {
      const reqTypeSafe = req as IQtumRPCGetLogsRequest
      const filter = reqTypeSafe.filter || {}
      if (!filter.addresses) {
        filter.addresses = [this.address]
      }

      const result = await rpc.getLogs({
        ...reqTypeSafe,
        filter
      })

      const entries = result.entries.map((entry) => {
        const parsedLog = this.logDecoder.decode(entry)
        return {
          ...entry,
          event: parsedLog
        }
      })

      const resultTypeSafe: IQtumContractEventLogs = {
        ...result,
        entries
      }

      return resultTypeSafe as any
    }

    if (rpc instanceof EthRPC) {
      const reqTypeSafe = req as IEthRPCGetLogsRequest
      const result = await rpc.getLogs({
        ...reqTypeSafe,
        address: this.address
      })

      const entries: IEthContractEventLog[] = result.map((entry) => {
        const parsedLog = this.logDecoder.decode(entry)
        return {
          ...entry,
          event: parsedLog
        }
      })

      return entries as any
    }

    throw new Error("Unsupported rpc type")
  }

  /**
   * Subscribe to contract's events, using callback interface.
   */
  public onLog(
    fn: (
      entry: TypeRPC extends QtumRPC
        ? IQtumContractEventLog
        : IEthContractEventLog
    ) => void,
    opts: TypeRPC extends QtumRPC
      ? IQtumRPCGetLogsRequest
      : IEthRPCGetLogsRequest = {} as any
  ): ICancelFunction {
    let fromBlock = opts.fromBlock || "latest"
    let toBlock = opts.toBlock || "latest"

    let canceled = false
    let latestBlockNum: number
    let isFirstFetch = true
    const { rpc } = this
    const isEth = rpc instanceof EthRPC
    const fetchToLatest = typeof fromBlock !== "number"

    const loop = async () => {
      while (!canceled) {
        latestBlockNum = await rpc.getBlockNumber()

        if (isEth) {
          if (typeof fromBlock !== "number") {
            fromBlock = latestBlockNum
          }

          if (fetchToLatest) {
            toBlock = latestBlockNum
          }

          if (
            fromBlock > toBlock ||
            (!isFirstFetch && fromBlock === toBlock)
          ) {
            await sleep(ETH_HALF_ESTIMATED_AVERAGE_BLOCK_TIME)
            continue
          }

          if (isFirstFetch) {
            isFirstFetch = false
          }
        } else {
          // qtum waitforlogs will throw `Incorrect params(code: -8)`
          // if `fromBlock > toBlock` (including `toBlock === "latest"`)
          // therefor we need to make sure block `fromBlock` is mined
          if (
            typeof fromBlock === "number" &&
            fromBlock > latestBlockNum
          ) {
            await sleep(2000)
            continue
          }
        }

        const result = await this.getLogs({
          ...(opts as any),
          fromBlock,
          toBlock
        })

        if (isEth) {
          const resultTypeSafe = result as IEthContractEventLog[]
          for (const entry of resultTypeSafe) {
            fn(entry as any)
          }

          fromBlock = latestBlockNum + 1
        } else {
          const resultTypeSafe = result as IQtumContractEventLogs
          for (const entry of resultTypeSafe.entries) {
            fn(entry as any)
          }
          fromBlock = resultTypeSafe.nextblock
        }
      }
    }

    loop()

    // return a cancel function
    return () => {
      canceled = true
    }
  }

  /**
   * Subscribe to contract's events, use EventsEmitter interface.
   */
  public logEmitter(
    opts: TypeRPC extends QtumRPC
      ? IQtumRPCGetLogsRequest
      : IEthRPCGetLogsRequest = {} as any
  ): ICancellableEventEmitter {
    const emitter = new EventEmitter()

    const cancel = this.onLog((entry) => {
      const key = (entry.event && entry.event.type) || "?"
      emitter.emit(key, entry)
    }, opts)

    return Object.assign(emitter, {
      cancel
    })
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
