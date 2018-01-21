import "mocha"
import { assert } from "chai"

import { repo, rpc, assertThrow } from "./test"
import { Contract } from "./Contract"

describe("Contract", () => {
  const contract = new Contract(rpc, repo.contracts["test/contracts/Methods.sol"])

  describe("#call", async () => {
    it("calls a method and get returned value", async () => {
      const result = await contract.call("getFoo")
      assert.hasAllKeys(result, [
        "address",
        "executionResult",
        "transactionReceipt",
        "outputs",
      ])

      const {
        outputs,
      } = result

      assert.isArray(outputs)
      assert.isNumber(outputs[0].toNumber())
    })

    it("throws error if method doesn't exist", async () => {
      await assertThrow(async () => {
        await contract.call("unknownMethod")
      })
    })

    it("throws error if using invalid number of parameters for a method", async () => {
      await assertThrow(async () => {
        await contract.call("getFoo", [1])
      }, "invalid number of parameters")
    })

    it("throws error if using invalid type for a parameter", async () => {
      await assertThrow(async () => {
        await contract.call("setFoo", ["zfoo bar baz"])
      }, "invalid parameter type")
    })
  })
})
