import { assert } from "chai"

import { QtumRPC } from "../QtumRPC"
import { EthRPC } from "../EthRPC"

export const rpcURL = "http://qtum:test@localhost:3889"

export const rpc = new QtumRPC(rpcURL)

export const ethRpcURL = `http://localhost:8545`
export const ethRpc = new EthRPC(ethRpcURL)

export const repoData = require("../../solar.development.json")

export async function generateBlock(n = 1) {
  return rpc.rawCall("generate", [n])
}

export async function assertThrow(
  fn: () => Promise<any>,
  msg?: string,
  report?: (err: any) => void,
) {
  let errorThrown: any = null

  try {
    await fn()
  } catch (err) {
    errorThrown = err
  }

  // assert.erro
  if (errorThrown && report) {
    report(errorThrown)
  }

  assert(errorThrown != null, msg ? `Expects error to be thrown: ${msg}` : "Expects error to be thrown")

  // assert.isNotNull(errorThrown, )
}
