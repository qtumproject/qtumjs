import { assert } from "chai"

import { QtumRPC } from "../QtumRPC"

export const rpc = new QtumRPC("http://qtum:test@localhost:3889")

export async function assertThrow(fn: () => Promise<any>) {
  let errorThrown: any = null

  try {
    await fn()
  } catch (err) {
    errorThrown = err
  }
  // await .catch((err) => {

  // })

  assert.isNotNull(errorThrown, "error is not thrown")
}
