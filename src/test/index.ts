import { assert } from "chai"

import { QtumRPC } from "../QtumRPC"

export const rpc = new QtumRPC("http://qtum:test@localhost:3889")

export const repo = require("../../solar.development.json")

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
