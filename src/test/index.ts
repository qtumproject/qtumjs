import { assert } from "chai"

import { QtumRPCRaw } from "../QtumRPCRaw"

import { QtumRPC } from "../QtumRPC"

export const rpcURL = "http://qtum:test@localhost:5889"

export const rpc = new QtumRPC(new QtumRPCRaw(rpcURL))

export const repoData = require("../../solar.development.json")

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
