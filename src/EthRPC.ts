import { RPCRaw } from "./RPCRaw"
import { ITransactionLog } from "./rpcCommonTypes"

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

  nonce?: number
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
  blockNumber?: number | string
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
  ): Promise<IEthRPCGetTransactionResult> {
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

    return receipt
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
}
