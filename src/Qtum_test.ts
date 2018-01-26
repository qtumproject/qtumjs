import "mocha"

import { assert } from "chai"

import { rpcURL, repoData } from "./test"
import { Qtum } from "./Qtum"
import { Contract } from "./Contract"

describe("Qtum", () => {
  const qtum = new Qtum(rpcURL, repoData)

  it("can instantiate a contract", () => {
    const contract = qtum.contract("test/contracts/Methods.sol")
    assert.instanceOf(contract, Contract)
  })

  it("throws an error if contract is not known", () => {
    // assertThrow
    assert.throw(() => {
      qtum.contract("test/contracts/Unknown.sol")
    })
  })
})
