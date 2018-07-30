import "mocha"

import { assert } from "chai"

import { ethRpcURL, repoData } from "./test"
import { Ethereum } from "./Ethereum"
import { Contract } from "./Contract"

describe("Ethereum", () => {
  const eth = new Ethereum(ethRpcURL, repoData)

  it("can instantiate a contract", () => {
    const contract = eth.contract("eth_Methods")
    assert.instanceOf(contract, Contract)
  })

  it("throws an error if contract is not known", () => {
    // assertThrow
    assert.throw(() => {
      eth.contract("eth_Unknown")
    })
  })
})
