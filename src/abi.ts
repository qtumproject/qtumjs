import {
  IABIMethod,
  IETHABI,
} from "./ethjs-abi"

const {
  decodeParams,
  encodeMethod,
} = require("ethjs-abi") as IETHABI

export function encodeInputs(method: IABIMethod, args: any[] = []): string {
  // slice to strip the leading "0x"
  const calldata = encodeMethod(method, args).slice(2)
  return calldata
}

export function decodeOutputs(method: IABIMethod, outputData: string): any[] {
  const types = method.outputs.map((output) => output.type)
  const result = decodeParams(types, "0x" + outputData)

  // NB: Result is an "array-like" object like arguments.

  // But apparently the following clone technique doesn't work.
  // return Array.prototype.slice.call(result)

  // Convert result to normal array...
  const values = []
  for (let i = 0; i < types.length; i++) {
    values[i] = result[i]
  }

  return values
}
