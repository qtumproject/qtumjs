import { QtumRPCRaw } from "./QtumRPCRaw"

export interface IGetInfoResult {
  version: number,
  protocolversion: number,
  walletversion: number,
  balance: number,
  stake: number,
  blocks: number,
  timeoffset: number,
  connections: number,
  proxy: string,
  difficulty: {
    "proof-of-work": number,
    "proof-of-stake": number,
  },
  testnet: boolean,
  moneysupply: number,
  keypoololdest: number,
  keypoolsize: number,
  paytxfee: number,
  relayfee: number,
  errors: string,
}

export interface IRPCSendToContractRequest {
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
  gasLimit?: number

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

  nonce?: number
}

export interface IRPCSendToContractResult {
  /**
   * The transaction id.
   */
  txid: string,
  /**
   * QTUM address of the sender.
   */
  sender?: string,
  /**
   * ripemd-160 hash of the sender.
   */
  hash160?: string,
}

export interface IRPCCallContractRequest {
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

  gasLimit?: number
  gasPrice?: number | string
  value?: number | string
  blockNumber?: number | string
}

export interface IExecutionResult {
  gasUsed: number,
  excepted: string,
  newAddress: string,
  output: string,
  codeDeposit: number,
  gasRefunded: number,
  depositSize: number,
  gasForDeposit: number,
}

export interface IRPCCallContractResult {
  address: string
  executionResult: IExecutionResult,
  transactionReceipt: {
    stateRoot: string,
    gasUsed: string,
    bloom: string,

    // FIXME: Need better typing
    log: any[],
  }
}

export interface IRPCGetTransactionRequest {
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
export interface IRPCGetTransactionResult {
  amount: number,
  fee: number,
  confirmations: number,
  blockhash: string,
  blockindex: number,
  blocktime: number,
  txid: string,
  // FIXME: Need better typing
  walletconflicts: any[],
  time: number,
  timereceived: number,
  "bip125-replaceable": "no" | "yes" | "unknown",
  // FIXME: Need better typing
  details: any[]
  hex: string,
}

/**
 * Basic information about a ethereum transaction submitted to the network.
 */
export interface IRPCGetTransactionResultEth {
  hash: string
  nonce: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  input: string
  blockHash?: string
  blockNumber?: string
  transactionIndex?: string
}

export interface IRPCGetTransactionReceiptRequest {
  /**
   * The transaction id
   */
  txid: string
}

/**
 * Transaction receipt returned by qtumd
 */
export interface IRPCGetTransactionReceiptBase {
  blockHash: string
  blockNumber: number

  transactionHash: string
  transactionIndex: number

  from: string
  to: string

  cumulativeGasUsed: number
  gasUsed: number

  contractAddress?: string
  status?: TRANSITION_STATUS
}

export enum TRANSITION_STATUS {
  FAILED,
  SUCCESS,
}

export interface IRPCGetTransactionReceiptResult extends IRPCGetTransactionReceiptBase {
  log?: ITransactionLog[]
  logs?: ITransactionLog[]
}

export interface ITransactionLog {
  address: string
  topics: string[]
  data: string
}

const sendToContractRequestDefaults = {
  value: 0,
  gasLimit: 200000,
  // FIXME: Does not support string gasPrice although the doc says it does.
  gasPrice: 0.0000004,
}

export interface IRPCWaitForLogsRequest {
  /**
   * The block number to start looking for logs.
   */
  fromBlock?: number | "latest",

  /**
   * The block number to stop looking for logs. If null, will wait indefinitely into the future.
   */
  toBlock?: number | "latest",

  /**
   * Filter conditions for logs. Addresses and topics are specified as array of hexadecimal strings
   */
  filter?: ILogFilter,

  /**
   * Minimal number of confirmations before a log is returned
   */
  minconf?: number,
}

export interface ILogFilter {
  addresses?: string[],
  topics?: Array<string | null>,
}

/**
 * The raw log data returned by qtumd, not ABI decoded.
 */
export interface ILogEntry extends IRPCGetTransactionReceiptBase {
  /**
   * EVM log topics
   */
  topics: string[]

  /**
   * EVM log data, as hexadecimal string
   */
  data: string
}

export interface IRPCWaitForLogsResult {
  entries: ILogEntry[],
  count: number,
  nextblock: number,
}

export interface IRPCSearchLogsRequest {
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

export type IRPCSearchLogsResult = IRPCGetTransactionReceiptResult[]

export interface IPromiseCancel<T> extends Promise<T> {
  cancel: () => void
}

export class QtumRPC extends QtumRPCRaw {
  private _hasTxWaitSupport: boolean | undefined
  private _isEthereumNetwork: boolean | undefined

  public constructor(_baseURL: string) {
    super(_baseURL)

    this.isEthereumNetwork()
  }

  public getInfo(): Promise<IGetInfoResult> {
    return this.rawCall("getinfo")
  }

  public async sendToContract(req: IRPCSendToContractRequest): Promise<IRPCSendToContractResult> {
    const isEthereumNetwork = await this.isEthereumNetwork()

    if (isEthereumNetwork) {
      return this.ethSendTransaction(req)
    }

    const vals = {
      ...sendToContractRequestDefaults,
      ...req,
    }

    const args = [
      vals.to,
      vals.data,
      vals.value,
      vals.gasLimit,
      vals.gasPrice,
    ]

    if (vals.from) {
      args.push(vals.from)
    }

    return this.rawCall("sendtocontract", args)
  }

  public async callContract(req: IRPCCallContractRequest): Promise<IRPCCallContractResult | string> {
    const isEthereumNetwork = await this.isEthereumNetwork()

    if (isEthereumNetwork) {
      return this.ethCall(req)
    }

    const args = [
      req.to,
      req.data,
    ]

    if (req.from) {
      args.push(req.from)
    }

    return this.rawCall("callcontract", args)
  }

  public async getTransaction(req: IRPCGetTransactionRequest):
    Promise<IRPCGetTransactionResult | IRPCGetTransactionResultEth> {
    const isEthereumNetwork = await this.isEthereumNetwork()

    if (isEthereumNetwork) {
      return this.ethGetTransaction(req)
    }

    const args: any[] = [
      req.txid,
    ]

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

  public async getTransactionReceipt(req: IRPCGetTransactionRequest): Promise<IRPCGetTransactionReceiptResult | null> {
    const isEthereumNetwork = await this.isEthereumNetwork()

    if (isEthereumNetwork) {
      return this.ethGetTransactionReceipt(req)
    }
    // The raw RPC API returns [] if tx id doesn't exist or not mined yet
    // When transaction is mined, the API returns [receipt]
    //
    // We'll do the unwrapping here.
    const result: IRPCGetTransactionReceiptResult[] = await this.rawCall("gettransactionreceipt", [req.txid])

    if (result.length === 0) {
      return null
    }

    return result[0]
  }

  /**
   * Long-poll request to get logs. Cancel the returned promise to terminate polling early.
   */
  public waitforlogs(req: IRPCWaitForLogsRequest = {}): IPromiseCancel<IRPCWaitForLogsResult> {
    const args = [
      req.fromBlock,
      req.toBlock,
      req.filter,
      req.minconf,
    ]

    const cancelTokenSource = this.cancelTokenSource()

    const p = this.rawCall("waitforlogs", args, { cancelToken: cancelTokenSource.token })

    return Object.assign(p, {
      cancel: cancelTokenSource.cancel.bind(cancelTokenSource),
    }) as any
  }

  public async searchlogs(_req: IRPCSearchLogsRequest = {}): Promise<IRPCSearchLogsResult> {
    const searchlogsDefaults = {
      fromBlock: "latest",
      toBlock: -1,
      addresses: [],
      topics: [],
      minconf: 0,
    }

    const req = {
      searchlogsDefaults,
      ..._req,
    }

    const args = [
      req.fromBlock,
      req.toBlock,
      req.addresses,
      req.topics,
      req.minconf,
    ]

    return this.rawCall("searchlogs", args)
  }

  public async checkTransactionWaitSupport(): Promise<boolean> {
    if (this._hasTxWaitSupport !== undefined) {
      return this._hasTxWaitSupport
    }

    const isEthereumNetwork = await this.isEthereumNetwork()
    if (isEthereumNetwork) {
      this._hasTxWaitSupport = false
      return false
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

  public async isEthereumNetwork(): Promise<boolean> {
    if (this._isEthereumNetwork !== undefined) {
      return this._isEthereumNetwork
    }

    try {
      await this.getInfo()
      this._isEthereumNetwork = false
      return false
    } catch (err) {
      if (err.message && /not allowed method|not supported/.test(err.message as string)) {
        this._isEthereumNetwork = true
        return true
      }

      throw err
    }
  }

  public async getGasPrice(): Promise<string> {
    return this.rawCall("eth_gasPrice")
  }

  public async getBlockNumber(): Promise<number> {
    const blockNumber = await this.rawCall("eth_blockNumber")
    return Number(blockNumber)
  }

  private async ethSendTransaction(req: IRPCSendToContractRequest): Promise<IRPCSendToContractResult> {
    if (req.from == null) {
      throw new Error("Parameter missing: `from`(transaction sender)")
    }

    const {
      gasLimit,
      gasPrice: configGasPrice,
      ...ethArgs
    } = req

    let gasPrice = configGasPrice
    if (!gasPrice) {
      gasPrice = await this.getGasPrice()
    }

    const args = [{
      ...ethArgs,
      gas: gasLimit || sendToContractRequestDefaults.gasLimit,
      gasPrice,
    }]

    const txid = await this.rawCall("eth_sendTransaction", args)
    return {
      txid
    }
  }

  private async ethCall(req: IRPCCallContractRequest): Promise<string> {
    if (req.from == null) {
      throw new Error("Parameter missing: `from`(transaction sender)")
    }

    const {
      gasLimit,
      gasPrice: configGasPrice,
      blockNumber,
      ...ethArgs
    } = req

    let gasPrice = configGasPrice
    if (!gasPrice) {
      gasPrice = Number(await this.getGasPrice())
    }

    const args: any[] = [
      {
        ...ethArgs,
        gas: gasLimit || sendToContractRequestDefaults.gasLimit,
        gasPrice,
      }
    ]

    if (blockNumber != null) {
      args.push(blockNumber)
    }

    return this.rawCall("eth_call", args)
  }

  private async ethGetTransaction(req: IRPCGetTransactionRequest): Promise<IRPCGetTransactionResultEth> {
    const args = [
      req.txid,
    ]

    return this.rawCall("eth_getTransactionByHash", args)
  }

  private async ethGetTransactionReceipt(req: IRPCGetTransactionRequest):
    Promise<IRPCGetTransactionReceiptResult | null> {
    const receipt = await this.rawCall("eth_getTransactionReceipt", [req.txid])
    if (receipt == null) {
      return null
    }

    return receipt
  }
}
