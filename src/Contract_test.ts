import "mocha"
import { assert } from "chai"

import { repo, rpc, assertThrow } from "./test"
import { Contract } from "./Contract"

describe("Contract", () => {
  // don't act as sender
  const {
    sender: _,
    ...info,
  } = repo.contracts["test/contracts/Methods.sol"]

  const contract = new Contract(rpc, info)

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

  describe("#send", async () => {
    it("can send and confirm tx", async () => {
      const v = Math.floor(Math.random() * 1000000)

      const tx = await contract.send("setFoo", [v])

      assert.equal(tx.confirmations, 0)

      await rpc.rawCall("generate", [1])

      const receipt = await tx.confirm(1, (r) => {
        assert.equal(r.confirmations, 1)
      })

      assert.hasAllKeys(receipt, [
        "blockHash",
        "blockNumber",
        "transactionHash",
        "transactionIndex",
        "from",
        "to",
        "cumulativeGasUsed",
        "gasUsed",
        "contractAddress",
        "logs",
        "rawlogs",
      ])

      const result = await contract.call("getFoo")
      assert.equal(result.outputs[0].toNumber(), v)
    })

  })
})
