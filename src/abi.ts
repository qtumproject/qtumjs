import { IABIMethod, IETHABI, ILogItem, LogDecoder } from "./ethjs-abi"

const {
  decodeParams,
  encodeMethod,
  logDecoder
} = require("qtumjs-ethjs-abi") as IETHABI

export function encodeInputs(
  method: IABIMethod,
  args: any[] = [],
  no0xPrefix = false
): string {
  const calldata = encodeMethod(method, args, no0xPrefix)
  return calldata
}

export function decodeOutputs(
  method: IABIMethod,
  outputData: string,
  no0xPrefix = false
): any[] {
  const types = method.outputs.map((output) => output.type)

  const result = decodeParams(
    [],
    types,
    outputData,
    undefined,
    Array(types.length),
    no0xPrefix
  )

  return result
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

  constructor(public abi: IABIMethod[], no0xPrefix = false) {
    this._decoder = logDecoder(abi, no0xPrefix)
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
