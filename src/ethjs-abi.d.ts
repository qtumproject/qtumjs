// import { IABI } from "./abi"

declare module "ethjs-abi" {
  interface IABI {
    name: string,
    type: string,
    payable: boolean,
    inputs: IABIInput[],
    outputs: IABIOutput[],
    constant: boolean,
  }

  interface IABIInput {
    name: string,
    type: string,
  }

  interface IABIOutput {
    name: string,
    type: string,
  }

  type Result = { [key: string]: any }

  function encodeMethod(method: IABI, values: any[]): string

  function decodeParams(types: string[], data: string, useNumberedParams?: boolean): Result
  function decodeParams(names: string[], types: string[], data: string, useNumberedParams?: boolean): Result

}