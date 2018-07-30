import "mocha"

import { assert } from "chai"

import { ethRpc, assertThrow } from "./test"

describe("EthRPC", () => {
  it("can make RPC call", async () => {
    const [blockNumber, gasPrice, accounts] = await Promise.all([
      ethRpc.rawCall("eth_blockNumber"),
      ethRpc.rawCall("eth_gasPrice"),
      ethRpc.rawCall("eth_accounts")
    ])

    assert.isString(blockNumber)
    assert.isString(gasPrice)
    assert.isArray(accounts)
    assert.isString(accounts[0])
    assert.isNotNaN(Number(blockNumber))
  })

  it("throws error if method is not found", async () => {
    await assertThrow(async () => {
      return ethRpc.rawCall("unknown-method")
    })
  })

  it("throws error if calling method using invalid params", async () => {
    await assertThrow(async () => {
      return ethRpc.rawCall("eth_blockNumber", [1, 2])
    })
  })
})
