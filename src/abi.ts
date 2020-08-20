import { IABIMethod, IETHABI, ILogItem, LogDecoder } from "./ethjs-abi"

const {
  decodeParams,
  encodeMethod,
  logDecoder,
  configure: configureABI,
} = require("qtumjs-ethjs-abi") as IETHABI

configureABI({ noHexStringPrefix: true })

import { ITransactionLog } from "./QtumRPC"

export function encodeInputs(method: IABIMethod, args: any[] = []): string {
  const calldata = encodeMethod(method, args)
  return calldata
}

export function decodeOutputs(method: IABIMethod, outputData: string): any[] {
  const types = method.outputs.map((output) => output.type)

  // FIXME: would be nice to explicitly request for Array result
  const result = decodeParams(types, outputData)

  // Convert result to normal array...
  const values = []
  for (let i = 0; i < types.length; i++) {
    values[i] = result[i]
  }

  return values
}

/**
 * A decoded Solidity event log
 */
export interface IDecodedSolidityEvent {
  /**
   * The event's name
   */
  type: string

  /**
   * Event parameters as a key-value map
   */
  [key: string]: any
}

export class ContractLogDecoder {
  private _decoder: LogDecoder

  constructor(public abi: IABIMethod[]) {
    this._decoder = logDecoder(abi)
  }

  public decode(rawlog: ILogItem): IDecodedSolidityEvent | null {
    const result = this._decoder([rawlog])

    if (result.length === 0) {
      return null
    }

    const log = result[0]

    return log as any
  }
}
