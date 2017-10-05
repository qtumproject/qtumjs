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

export interface ISendToContractRequest {
  /**
   * (required) The contract address that will receive the funds and data.
   */
  address: string

  /**
   * (required) data to send
   */
  datahex: string

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

  /**
   * Whether to broadcast the transaction or not (default: true)
   */
  // broadcast?: boolean
}

export interface ISendToContractResult {
  /**
   * The transaction id.
   */
  txid: string,
  /**
   * QTUM address of the sender.
   */
  sender: string,
  /**
   * ripemd-160 hash of the sender.
   */
  hash160: string,
}

export interface ICallContractRequest {
  /**
   * (required) The account address
   */
  address: string

  /**
   * (required) The data hex string
   */
  datahex: string

  /**
   * The sender address hex string
   */
  senderAddress?: string
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

export interface ICallContractResult {
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

interface IGetTransactionRequest {
  /**
   * The transaction id
   */
  txid: string

  /**
   * (optional, default=false) Whether to include watch-only addresses in balance calculation and details[]
   */
  include_watchonly?: boolean
}

interface IGetTransactionResult {
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

const sendToContractRequestDefaults = {
  amount: 0,
  gasLimit: 200000,
  // FIXME: Does not support string gasPrice although the doc says it does.
  gasPrice: 0.0000004,
}

export class QtumRPC extends QtumRPCRaw {
  public getInfo(): Promise<IGetInfoResult> {
    return this.rawCall("getinfo")
  }

  public sendToContract(req: ISendToContractRequest): Promise<ISendToContractResult> {
    const vals = {
      ...sendToContractRequestDefaults,
      ...req,
    }

    const args = [
      vals.address,
      vals.datahex,
      vals.amount,
      vals.gasLimit,
      vals.gasPrice,
    ]

    if (vals.senderAddress) {
      args.push(vals.senderAddress)
    }

    return this.rawCall("sendtocontract", ...args)
  }

  public callContrct(req: ICallContractRequest): Promise<ICallContractResult> {
    const args = [
      req.address,
      req.datahex,
    ]

    if (req.senderAddress) {
      args.push(req.senderAddress)
    }

    return this.rawCall("callcontract", ...args)
  }

  public getTransaction(req: IGetTransactionRequest): Promise<IGetTransactionResult> {
    const args: any[] = [
      req.txid,
    ]

    if (req.include_watchonly) {
      args.push(req.include_watchonly)
    }

    return this.rawCall("gettransaction", ...args)
  }
}
