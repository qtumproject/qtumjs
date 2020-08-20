// partial type definitions for ethjs-abi
export interface IABIMethod {
  name: string
  type: string
  payable: boolean
  inputs: IABIInput[]
  outputs: IABIOutput[]
  constant: boolean
  anonymous: boolean
}

export interface IABIInput {
  name: string
  type: string
  indexed: boolean
}

export interface IABIOutput {
  name: string
  type: string
  indexed: boolean
}

export interface IResult {
  [key: string]: any
}

export interface ILogItem {
  data: string
  topics: string[]
}

export interface IParsedLog extends IResult {
  _eventName: string
  [key: string]: any
}

export type LogDecoder = (logs: ILogItem[]) => IParsedLog[]

export interface IETHABI {
  encodeMethod(method: IABIMethod, values: any[]): string

  decodeParams(
    types: string[],
    data: string,
    useNumberedParams?: boolean,
  ): IResult
  decodeParams(
    names: string[],
    types: string[],
    data: string,
    useNumberedParams?: boolean,
  ): IResult

  decodeLogItem(
    eventObject: IABIMethod,
    log: ILogItem,
    useNumberedParams?: boolean,
  ): IResult

  logDecoder(abi: IABIMethod[], useNumberedParams?: boolean): LogDecoder

  configure(opts: any): any
}
