import {
  decodeParams,
  encodeMethod,
  IABI,
} from "ethjs-abi"

import {
  ICallContractResult,
  ISendToContractResult,
  QtumRPC,
} from "./QtumRPC"

interface IContractInfo {
  /**
   * Contract ABI methods
   */
  abi: IABI[]
  /**
   * Address of contract
   */
  address: string
}

export class Contract {

  // private abi: IABI[]
  private address: string
  private callMethodsMap: { [key: string]: IABI } = {}
  private sendMethodsMap: { [key: string]: IABI } = {}

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

  /**
   * Call a contract method using ABI encoding, and return the RPC result as is. This
   * does not create a transaction. It is useful for gas estimation or getting results from
   * read-only methods.
   *
   * @param method name of contract method to call
   * @param args arguments
   */
  public async rawCall(method: string, args: any[] = [], opts = {}): Promise<ICallContractResult> {
    // TODO opts: sender address
    const methodABI = this.callMethodsMap[method]
    if (methodABI == null) {
      throw new Error(`Unknown method to call: ${method}`)
    }

    // need to strip the leading "0x"
    const calldata = encodeMethod(methodABI, args).slice(2)

    // TODO decode?
    return this.rpc.callContrct({
      address: this.address,
      datahex: calldata,
    })
  }

  public async call(method: string, args: any[] = [], opts = {}): Promise<any> {
    const r = await this.rawCall(method, args, opts)

    const exception = r.executionResult.excepted
    if (exception !== "None") {
      throw new Error(`Call exception: ${exception}`)
    }

    const output = r.executionResult.output
    if (output === "") {
      return null
    }

    const methodABI = this.callMethodsMap[method]
    const types = methodABI.outputs.map((abiOutput) => abiOutput.type)
    const result = decodeParams(types, "0x" + output)

    // NB: Result is an "array-like" object like arguments. But apparently the following clone technique doesn't work.
    // return Array.prototype.slice.call(result)

    // Convert result to normal array...
    const returnValues = []
    for (let i = 0; i < types.length; i++) {
      returnValues[i] = result[i]
    }
    return returnValues

    // TODO support the named return values mechanism

  }

  /**
   * Create a transaction that calls a method using ABI encoding, and return the RPC result as is.
   * A transaction will require network consensus to confirm, and costs you gas.
   *
   * @param method name of contract method to call
   * @param args arguments
   */
  public async rawSend(method: string, args: any[], opts = {}): Promise<ISendToContractResult> {
    // TODO opts: gas limit, gas price, sender address
    const methodABI = this.sendMethodsMap[method]
    if (methodABI == null) {
      throw new Error(`Unknown method to send: ${method}`)
    }

    // need to strip the leading "0x"
    const calldata = encodeMethod(methodABI, args).slice(2)

    return this.rpc.sendToContract({
      address: this.address,
      datahex: calldata,
    })
  }

}
