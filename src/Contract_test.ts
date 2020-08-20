import "mocha"
import { assert } from "chai"

import { repoData, rpc, assertThrow, generateBlock } from "./test"
import { Contract } from "./Contract"

describe("Contract", () => {
  // don't act as sender
  const { sender: _, ...info } = repoData.contracts[
    "test/contracts/Methods.sol"
  ]

  const contract = new Contract(rpc, info)

  describe("#call", async () => {
    it("calls a method and get returned value", async () => {
      const result = await contract.call("getFoo")
      assert.hasAllKeys(result, [
        "address",
        "executionResult",
        "transactionReceipt",
        "logs",
        "outputs",
      ])

      const { outputs } = result

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

    describe("method overloading", () => {
      const overload = new Contract(
        rpc,
        repoData.contracts["test/contracts/MethodOverloading.sol"],
      )

      it("calls a method and get returned value", async () => {
        let result
        result = await overload.call("foo")
        assert.equal(result.outputs[0], "foo()")

        result = await overload.call("foo()")
        assert.equal(result.outputs[0], "foo()")

        result = await overload.call("foo(uint256)", [1])
        assert.equal(result.outputs[0], "foo(uint256)")
        result = await overload.call("foo(string)", ["a"])
        assert.equal(result.outputs[0], "foo(string)")

        result = await overload.call("foo(uint256,uint256)", [1, 2])
        assert.equal(result.outputs[0], "foo(uint256,uint256)")
        result = await overload.call("foo(int256,int256)", [1, 2])
        assert.equal(result.outputs[0], "foo(int256,int256)")

        result = await overload.call("foo", [1, 2, 3])
        assert.equal(result.outputs[0], "foo(int256,int256,int256)")
        result = await overload.call("foo(int256,int256,int256)", [1, 2, 3])
        assert.equal(result.outputs[0], "foo(int256,int256,int256)")
      })
    })
  })

  describe("ABI encoding", async () => {
    it("can encode address[]", async () => {
      const logs = new Contract(
        rpc,
        repoData.contracts["test/contracts/ArrayArguments.sol"],
      )

      const calldata = logs.encodeParams("takeArray", [
        [
          "aa00000000000000000000000000000000000011",
          "bb00000000000000000000000000000000000022",
        ],
      ])

      assert.equal(
        calldata,
        // tslint:disable-next-line:max-line-length
        `ee3b88ea00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000aa00000000000000000000000000000000000011000000000000000000000000bb00000000000000000000000000000000000022`,
      )
    })
  })

  describe("#send", async () => {
    it("can send and confirm tx", async () => {
      const v = Math.floor(Math.random() * 1000000)

      const tx = await contract.send("setFoo", [v])

      assert.equal(tx.confirmations, 0)

      await generateBlock(1)

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
        "excepted",
        "exceptedMessage",
        "cumulativeGasUsed",
        "gasUsed",
        "contractAddress",
        "logs",
        "outputIndex",
        "rawlogs",
      ])

      const result = await contract.call("getFoo")
      assert.equal(result.outputs[0].toNumber(), v)
    })

    it("throws error if method exists but is constant", async () => {
      await assertThrow(async () => {
        await contract.send("getFoo")
      }, "method is contant")
    })
  })

  describe("event logs", () => {
    const logs = new Contract(
      rpc,
      repoData.contracts["test/contracts/Logs.sol"],
    )

    it("decodes logs for call", async () => {
      const result = await logs.call("emitFooEvent", ["abc"])
      assert.deepEqual(result.logs, [
        {
          type: "FooEvent",
          a: "abc",
        },
      ])
    })
  })
})
