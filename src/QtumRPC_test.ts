import "mocha"

import { assert } from "chai"

import { rpc, assertThrow } from "./test"

// import { } from "mocha"
describe("QtumRPC", () => {
  it("can make RPC call", async () => {
    const info = await rpc.rawCall("getblockchaininfo")
    assert.isNotEmpty(info)
    // assert.hasAllKeys(info, [
    //   "version",
    //   "protocolversion",
    //   "walletversion",
    //   "balance",
    //   "stake",
    //   "blocks",
    //   "deprecation-warning",
    //   "timeoffset",
    //   "connections",
    //   "proxy",
    //   "difficulty",
    //   "testnet",
    //   "moneysupply",
    //   "keypoololdest",
    //   "keypoolsize",
    //   "paytxfee",
    //   "relayfee",
    //   "errors",
    // ])
  })

  it("throws error if method is not found", async () => {
    await assertThrow(async () => {
      return rpc.rawCall("unknown-method")
    })
  })

  it("throws error if calling method using invalid params", async () => {
    await assertThrow(async () => {
      return rpc.rawCall("getinfo", [1, 2])
    })
  })

  it("can convert a hex address to a p2pkh address", async () => {
    const p2pkhAddress = await rpc.fromHexAddress(
      "b22cbfd8dffcd4e0120279c2cc41315fac2335e2",
    )
    assert.strictEqual(p2pkhAddress, "qZoV3RKeHaxKM5RnuZdA5bwoYTCH73QLrE")
  })

  it("can convert a p2pkh address to a hex address", async () => {
    const hexAddress = await rpc.getHexAddress(
      "qZoV3RKeHaxKM5RnuZdA5bwoYTCH73QLrE",
    )
    assert.strictEqual(hexAddress, "b22cbfd8dffcd4e0120279c2cc41315fac2335e2")
  })
})
