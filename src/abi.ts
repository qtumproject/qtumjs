import {
  IABIMethod,
  IETHABI,
  ILogItem,
  LogDecoder,
} from "./ethjs-abi"

const {
  decodeParams,
  encodeMethod,
  logDecoder,
} = require("ethjs-abi") as IETHABI

import {
  ITransactionLog,
} from "./QtumRPC"

function ensureHex0x(hexstr: string): string {
  if (hexstr[0] === "0" && hexstr[1] === "x") {
    return hexstr
  }

  return "0x" + hexstr
}

export function encodeInputs(method: IABIMethod, args: any[] = []): string {
  // massage "address" strings by appending 0x
  args = args.map((arg, i) => {
    const input = method.inputs[i]
    if (!input) {
      return arg
    }

    if (input.type === "address") {
      return ensureHex0x(arg)
    }

    return arg
  })

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
    const result = this._decoder([{
      data: ensureHex0x(rawlog.data),
      topics: rawlog.topics.map(ensureHex0x),
    }])

    if (result.length === 0) {
      return null
    }

    const log = result[0]

    const type = log._eventName

    const logABI = this.abi.find((method) => method.name === type)

    if (!logABI) {
      throw new Error(`Cannot find ABI for event type: ${type}`)
    }

    const decodedLog: IDecodedSolidityEvent = {
      type,
    }

    // logABI.inputs.forEach(())
    for (const input of logABI.inputs) {
      decodedLog[input.name] = log[input.name] as any
    }

    return decodedLog
  }
}

export function decodeLogs(methods: IABIMethod[], logs: ILogItem[]): IDecodedSolidityEvent[] {
  const decoder = logDecoder(methods)

  // Add the 0x prefix to all hex strings, else abi parsing would fail
  const rawlogs = logs.map((log) => {
    // console.log("rawlog", log)
    return {
      // address: ensureHex0x(log.address),
      data: ensureHex0x(log.data),
      topics: log.topics.map(ensureHex0x),
    }
  })

  const parsedLogs = decoder(rawlogs)

  // Remove the "array-like" behaviour. Just return a map of event parameters.
  return parsedLogs.map((log) => {
    const type = log._eventName

    const logABI = methods.find((method) => method.name === type)

    if (!logABI) {
      throw new Error(`Cannot find ABI for event type: ${type}`)
    }

    const decodedLog: IDecodedSolidityEvent = {
      type,
    }

    // logABI.inputs.forEach(())
    for (const input of logABI.inputs) {
      decodedLog[input.name] = log[input.name] as any
    }

    return decodedLog
  })
}
