import { IABIMethod, IETHABI } from "./ethjs-abi"

import {
  decodeOutputs,
  encodeInputs,
} from "./abi"

import {
  ContractSendReceipt,
} from "./ContractSendReceipt"

import {
  IExecutionResult,
  IRPCCallContractResult,
  IRPCSendToContractResult,
  QtumRPC,
} from "./QtumRPC"

export interface IContractInfo {
  /**
   * Contract ABI methods
   */
  abi: IABIMethod[]
  /**
   * Address of contract
   */
  address: string

  name: string
  deployName: string
  txid: string
  bin: string
  binhash: string
  createdAt: string // date string
  confirmed: boolean
}

export interface IContractCallDecodedResult extends IRPCCallContractResult {
  outputs: any[]
  // [key: number]: any
}

export class Contract {

  // private abi: IABI[]
  private address: string
  private callMethodsMap: { [key: string]: IABIMethod } = {}
  private sendMethodsMap: { [key: string]: IABIMethod } = {}

  constructor(private rpc: QtumRPC, info: IContractInfo) {
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
  public async rawCall(method: string, args: any[] = [], opts = {}): Promise<IRPCCallContractResult> {
    // TODO opts: sender address

    // need to strip the leading "0x"
    const calldata = this.encodeParams(method, args)

    // TODO decode?
    return this.rpc.callContrct({
      address: this.address,
      datahex: calldata,
    })
  }

  public async call(method: string, args: any[] = [], opts = {}): Promise<IContractCallDecodedResult> {
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
  public async rawSend(method: string, args: any[], opts = {}): Promise<IRPCSendToContractResult> {
    // TODO opts: gas limit, gas price, sender address
    const methodABI = this.sendMethodsMap[method]
    if (methodABI == null) {
      throw new Error(`Unknown method to send: ${method}`)
    }

    const calldata = encodeInputs(methodABI, args)

    return this.rpc.sendToContract({
      address: this.address,
      datahex: calldata,
    })
  }

  public async send(method: string, args: any[], opts = {}): Promise<ContractSendReceipt> {
    const r = await this.rawSend(method, args, opts)
    return new ContractSendReceipt(this.rpc, r)
  }
}
