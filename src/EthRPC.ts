import { RPCRaw } from "./RPCRaw"
import { ITransactionLog, IPromiseCancel } from "./rpcCommonTypes"

export interface IEthRPCSendTransactionRequest {
  /**
   * (required) The contract address that will receive the funds and data.
   */
  to: string

  /**
   * (required) data to send
   */
  data: string

  /**
   * The ethereum address that will be used as sender.
   */
  from?: string

  /**
   * The amount in ETH to send. eg 0.1, default: 0
   */
  value?: number | string

  /**
   * gasLimit, default: 200000, max: 40000000
   */
  gasLimit?: number

  /**
   * Ethereum price per gas unit
   */
  gasPrice?: number | string

  nonce?: number | string
}

export interface IEthRPCSendTransactionResult {
  /**
   * The transaction id.
   */
  txid: string
}

export interface IEthRPCCallRequest {
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

  gasLimit?: number | string
  gasPrice?: number | string
  value?: number | string
  /**
   * integer block number, or the string "latest", "earliest" or "pending"
   */
  blockNumber?: typeBlockTags
}

/**
 * Basic information about a ethereum transaction submitted to the network.
 */
export interface IEthRPCGetTransactionResult {
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

/**
 * Transaction receipt returned by qtumd
 */
export interface IEthRPCGetTransactionReceiptBase {
  blockHash: string
  blockNumber: number

  transactionHash: string
  transactionIndex: number

  from: string
  to: string

  cumulativeGasUsed: number
  gasUsed: number

  contractAddress?: string
}

export enum ETH_TRANSACTION_STATUS {
  FAILED,
  SUCCESS
}

export interface IEthRPCGetTransactionReceiptResult
  extends IEthRPCGetTransactionReceiptBase {
  logs: ITransactionLog[]
  logsBloom: string
  status?: ETH_TRANSACTION_STATUS
}

export type typeBlockTags = number | "latest" | "pending" | "earliest"

export interface IEthRPCGetLogsRequest {
  /**
   * The block number to start looking for logs.
   */
  fromBlock?: typeBlockTags

  /**
   * The block number to stop looking for logs.
   */
  toBlock?: typeBlockTags

  /**
   * contract address
   */
  address?: string[] | string

  /**
   * filter topics
   */
  topics?: Array<string | null>
}

export interface IEthLogEntry {
  /**
   *  `true` when the log was removed, due to a chain reorganization. `false` if
   * its a valid log.
   */
  removed: boolean

  /**
   * integer of the log index position in the block. `null` when its pending.
   */
  logIndex: string | null

  /**
   * integer of the transactions index position log was created from. `null`
   * when its pending
   */
  transactionIndex: string | null

  /**
   * hash of the transactions this log was created from. `null` when its pending
   */
  transactionHash: string | null

  /**
   * hash of the block where this log was in. `null` when its pending.
   */
  blockHash: string | null

  /**
   * the block number where this log was in. `null` when its pending
   */
  blockNumber: string | null

  /**
   * address from which this log originated
   */
  address: string

  /**
   * contains one or more 32 Bytes non-indexed arguments of the log.
   */
  data: string

  /**
   * Array of 0 to 4 32 Bytes data of indexed log arguments. (In solidity: The
   * first topic is the hash of the signature of the event, except you declared
   * the event with the `anonymous` specifier
   */
  topics: string[]
}

const DEFAULT_GAS_LIMIT = 200000

export class EthRPC extends RPCRaw {
  private _sender: string | undefined

  constructor(baseUrl: string, sender?: string) {
    super(baseUrl)
    this._sender = sender
  }

  public async getSender(): Promise<string | undefined> {
    if (this._sender) {
      return this._sender
    }

    // we don't save sender, since accounts[0] might vary
    const accounts = await this.getAccounts()
    return accounts[0]
  }

  public async sendTransaction(
    req: IEthRPCSendTransactionRequest
  ): Promise<IEthRPCSendTransactionResult> {
    const { gasLimit, gasPrice: configGasPrice, ...ethArgs } = req
    let from = req.from
    if (!from) {
      from = await this.getSender()
    }
    if (!from) {
      throw new Error("cannot get eth sender")
    }

    let gasPrice = configGasPrice
    if (!gasPrice) {
      gasPrice = await this.getGasPrice()
    }

    const args = [
      {
        ...ethArgs,
        from,
        gas: gasLimit || DEFAULT_GAS_LIMIT,
        gasPrice
      }
    ]

    const txid = await this.rawCall("eth_sendTransaction", args)
    return {
      txid
    }
  }

  public async call(req: IEthRPCCallRequest): Promise<string> {
    const { gasLimit, gasPrice: configGasPrice, blockNumber, ...ethArgs } = req
    let from = req.from
    if (!from) {
      from = await this.getSender()
    }
    if (!from) {
      throw new Error("cannot get eth sender")
    }

    let gasPrice = configGasPrice
    if (!gasPrice) {
      gasPrice = await this.getGasPrice()
    }

    const args: any[] = [
      {
        ...ethArgs,
        from,
        gas: gasLimit || DEFAULT_GAS_LIMIT,
        gasPrice
      }
    ]

    if (blockNumber != null) {
      args.push(blockNumber)
    }

    return this.rawCall("eth_call", args)
  }

  public async getTransaction(
    txid: string
  ): Promise<IEthRPCGetTransactionResult | null> {
    const args = [txid]

    return this.rawCall("eth_getTransactionByHash", args)
  }

  public async getTransactionReceipt(
    txid: string
  ): Promise<IEthRPCGetTransactionReceiptResult | null> {
    const receipt = await this.rawCall("eth_getTransactionReceipt", [txid])
    if (receipt == null) {
      return null
    }

    let { from, to } = receipt
    if (from == null && to == null) {
      // eth_getTransactionReceipt on testrpc (and some other clients?) will not
      // return `from` and `to`
      const tx = (await this.getTransaction(txid))!
      from = tx.from
      to = tx.to
    }

    return {
      ...receipt,
      from,
      to
    }
  }

  public async getGasPrice(): Promise<string> {
    return this.rawCall("eth_gasPrice")
  }

  public async getBlockNumber(): Promise<number> {
    const blockNumber = await this.rawCall("eth_blockNumber")
    return Number(blockNumber)
  }

  public async getAccounts(): Promise<string[]> {
    return this.rawCall("eth_accounts")
  }

  public async getTransactionCount(
    address: string,
    block: typeBlockTags = "latest"
  ): Promise<number> {
    const count = await this.rawCall("eth_getTransactionCount", [
      address,
      block
    ])
    return Number(count)
  }

  public async getBalance(
    address: string,
    block: typeBlockTags = "latest"
  ): Promise<string> {
    return await this.rawCall("eth_getBalance", [address, block])
  }

  public getLogs(
    req: IEthRPCGetLogsRequest = {}
  ): IPromiseCancel<IEthLogEntry[]> {
    const cancelTokenSource = this.cancelTokenSource()

    const result = this.rawCall("eth_getLogs", [req], {
      cancelToken: cancelTokenSource.token
    }) as IPromiseCancel<any>

    return Object.assign(result, {
      cancel: cancelTokenSource.cancel.bind(cancelTokenSource)
    })
  }
}
