import { assert } from "chai"

import { QtumRPCRaw } from "../QtumRPCRaw"

import { QtumRPC } from "../QtumRPC"

export const rpcURL = process.env.QTUM_RPC || "http://qtum:test@localhost:3889"

export const rpc = new QtumRPC(new QtumRPCRaw(rpcURL))

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

  assert(
    errorThrown != null,
    msg ? `Expects error to be thrown: ${msg}` : "Expects error to be thrown",
  )

  // assert.isNotNull(errorThrown, )
}
