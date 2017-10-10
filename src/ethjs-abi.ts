// import { IABI } from "./abi"

// tslint:disable-next-line:no-namespace

export interface IABI {
  name: string,
  type: string,
  payable: boolean,
  inputs: IABIInput[],
  outputs: IABIOutput[],
  constant: boolean,
}

export interface IABIInput {
  name: string,
  type: string,
}

export interface IABIOutput {
  name: string,
  type: string,
}

export interface IResult {
  [key: string]: any
}

export interface IETHABI {
  encodeMethod(method: IABI, values: any[]): string

  decodeParams(types: string[], data: string, useNumberedParams?: boolean): IResult
  decodeParams(names: string[], types: string[], data: string, useNumberedParams?: boolean): IResult
}
