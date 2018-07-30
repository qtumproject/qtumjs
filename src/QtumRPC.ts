import { RPCRaw } from "./RPCRaw"
import { ITransactionLog, IPromiseCancel } from "./rpcCommonTypes"

export interface IGetInfoResult {
  version: number
  protocolversion: number
  walletversion: number
  balance: number
  stake: number
  blocks: number
  timeoffset: number
  connections: number
  proxy: string
  difficulty: {
    "proof-of-work": number
    "proof-of-stake": number
  }
  testnet: boolean
  moneysupply: number
  keypoololdest: number
  keypoolsize: number
  paytxfee: number
  relayfee: number
  errors: string
}

export interface IQtumRPCSendTransactionRequest {
  /**
   * (required) The contract address that will receive the funds and data.
   */
  to: string

  /**
   * (required) data to send
   */
  data: string

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
   * The quantum address that will be used as sender.
   */
  from?: string

  /**
   * Whether to broadcast the transaction or not (default: true)
   */
  // broadcast?: boolean
  nonce?: undefined
}

export interface IQtumRPCSendTransactionResult {
  /**
   * The transaction id.
   */
  txid: string
  /**
   * QTUM address of the sender.
   */
  sender: string
  /**
   * ripemd-160 hash of the sender.
   */
  hash160: string
}

export interface IQtumRPCCallRequest {
  /**
   * (required) The account address
   */
  to: string

  /**
   * (required) The data hex string
   */
  data: string

  /**
   * The sender address hex string
   */
  from?: string
}

export interface IExecutionResult {
  gasUsed: number
  excepted: string
  newAddress: string
  output: string
  codeDeposit: number
  gasRefunded: number
  depositSize: number
  gasForDeposit: number
}

export interface IQtumRPCCallResult {
  address: string
  executionResult: IExecutionResult
  transactionReceipt: {
    stateRoot: string
    gasUsed: string
    bloom: string

    // FIXME: Need better typing
    log: any[]
  }
}

export interface IQtumRPCGetTransactionRequest {
  /**
   * The transaction id
   */
  txid: string

  /**
   * (optional, default=false) Whether to include watch-only addresses in balance calculation and details[]
   */
  include_watchonly?: boolean

  /**
   * (optional, default=0) Wait for enough confirmations before returning
   */
  waitconf?: number
}

/**
 * Basic information about a transaction submitted to the network.
 */
export interface IQtumRPCGetTransactionResult {
  amount: number
  fee: number
  confirmations: number
  blockhash: string
  blockindex: number
  blocktime: number
  txid: string
  // FIXME: Need better typing
  walletconflicts: any[]
  time: number
  timereceived: number
  "bip125-replaceable": "no" | "yes" | "unknown"
  // FIXME: Need better typing
  details: any[]
  hex: string
}

export interface IQtumRPCGetTransactionReceiptRequest {
  /**
   * The transaction id
   */
  txid: string
}

/**
 * Transaction receipt returned by qtumd
 */
export interface IQtumRPCGetTransactionReceiptBase {
  blockHash: string
  blockNumber: number

  transactionHash: string
  transactionIndex: number

  from: string
  to: string

  cumulativeGasUsed: number
  gasUsed: number

  contractAddress: string
}

export interface IQtumRPCGetTransactionReceiptResult
  extends IQtumRPCGetTransactionReceiptBase {
  log: ITransactionLog[]
}

const SEND_TRANSACTION_REQUEST_DEFAULTS = {
  value: 0,
  gasLimit: 200000,
  // FIXME: Does not support string gasPrice although the doc says it does.
  gasPrice: 0.0000004
}

export interface IQtumRPCGetLogsRequest {
  /**
   * The block number to start looking for logs.
   */
  fromBlock?: number | "latest"

  /**
   * The block number to stop looking for logs. If null, will wait indefinitely into the future.
   */
  toBlock?: number | "latest"

  /**
   * Filter conditions for logs. Addresses and topics are specified as array of hexadecimal strings
   */
  filter?: ILogFilter

  /**
   * Minimal number of confirmations before a log is returned
   */
  minconf?: number
}

export interface ILogFilter {
  addresses?: string[]
  topics?: Array<string | null>
}

/**
 * The raw log data returned by qtumd, not ABI decoded.
 */
export interface IQtumLogEntry extends IQtumRPCGetTransactionReceiptBase {
  /**
   * EVM log topics
   */
  topics: string[]

  /**
   * EVM log data, as hexadecimal string
   */
  data: string
}

export interface IQtumRPCGetLogsResult {
  entries: IQtumLogEntry[]
  count: number
  nextblock: number
}

export interface IQtumRPCSearchLogsRequest {
  /**
   * The number of the earliest block (latest may be given to mean the most recent block).
   * (default = "latest")
   */
  fromBlock?: number | "latest"

  /**
   * The number of the latest block (-1 may be given to mean the most recent block).
   * (default = -1)
   */
  toBlock?: number

  /**
   * An address or a list of addresses to only get logs from particular account(s).
   */
  addresses?: string[]

  /**
   * An array of values which must each appear in the log entries.
   * The order is important, if you want to leave topics out use null, e.g. ["null", "0x00..."].
   */
  topics?: Array<string | null>

  /**
   * Minimal number of confirmations before a log is returned
   * (default = 0)
   */
  minconf?: number
}

export type IRPCSearchLogsResult = IQtumRPCGetTransactionReceiptResult[]

export class QtumRPC extends RPCRaw {
  private _hasTxWaitSupport: boolean | undefined

  public getInfo(): Promise<IGetInfoResult> {
    return this.rawCall("getinfo")
  }

  public async sendTransaction(
    req: IQtumRPCSendTransactionRequest
  ): Promise<IQtumRPCSendTransactionResult> {
    const vals = {
      ...SEND_TRANSACTION_REQUEST_DEFAULTS,
      ...req
    }

    const args = [vals.to, vals.data, vals.value, vals.gasLimit, vals.gasPrice]

    if (vals.from) {
      args.push(vals.from)
    }

    return this.rawCall("sendtocontract", args)
  }

  public async call(req: IQtumRPCCallRequest): Promise<IQtumRPCCallResult> {
    const args = [req.to, req.data]

    if (req.from) {
      args.push(req.from)
    }

    return this.rawCall("callcontract", args)
  }

  public async getTransaction(
    req: IQtumRPCGetTransactionRequest
  ): Promise<IQtumRPCGetTransactionResult> {
    const args: any[] = [req.txid]

    if (req.include_watchonly) {
      args.push(req.include_watchonly)
    } else {
      args.push(false)
    }

    if (req.waitconf) {
      args.push(req.waitconf)
    }

    return this.rawCall("gettransaction", args)
  }

  public async getTransactionReceipt(
    req: IQtumRPCGetTransactionRequest
  ): Promise<IQtumRPCGetTransactionReceiptResult | null> {
    // The raw RPC API returns [] if tx id doesn't exist or not mined yet
    // When transaction is mined, the API returns [receipt]
    //
    // We'll do the unwrapping here.
    const result: IQtumRPCGetTransactionReceiptResult[] = await this.rawCall(
      "gettransactionreceipt",
      [req.txid]
    )

    if (result.length === 0) {
      return null
    }

    return result[0]
  }

  /**
   * Long-poll request to get logs. Cancel the returned promise to terminate polling early.
   */
  public getLogs(
    req: IQtumRPCGetLogsRequest = {}
  ): IPromiseCancel<IQtumRPCGetLogsResult> {
    const { filter = {} } = req
    const args = [req.fromBlock, req.toBlock, filter, req.minconf]

    const cancelTokenSource = this.cancelTokenSource()

    const p = this.rawCall("waitforlogs", args, {
      cancelToken: cancelTokenSource.token
    }) as IPromiseCancel<any>

    return Object.assign(p, {
      cancel: cancelTokenSource.cancel.bind(cancelTokenSource)
    })
  }

  public async searchlogs(
    _req: IQtumRPCSearchLogsRequest = {}
  ): Promise<IRPCSearchLogsResult> {
    const searchlogsDefaults = {
      fromBlock: "latest",
      toBlock: -1,
      addresses: [],
      topics: [],
      minconf: 0
    }

    const req = {
      searchlogsDefaults,
      ..._req
    }

    const args = [
      req.fromBlock,
      req.toBlock,
      req.addresses,
      req.topics,
      req.minconf
    ]

    return this.rawCall("searchlogs", args)
  }

  public async checkTransactionWaitSupport(): Promise<boolean> {
    if (this._hasTxWaitSupport !== undefined) {
      return this._hasTxWaitSupport
    }

    const helpmsg: string = await this.rawCall("help", ["gettransaction"])
    this._hasTxWaitSupport = helpmsg.split("\n")[0].indexOf("waitconf") !== -1
    return this._hasTxWaitSupport
  }

  public async fromHexAddress(hexAddress: string): Promise<string> {
    return this.rawCall("fromhexaddress", [hexAddress])
  }

  public async getHexAddress(address: string): Promise<string> {
    return this.rawCall("gethexaddress", [address])
  }

  public async getBlockNumber(): Promise<number> {
    return this.rawCall("getblockcount")
  }
}
