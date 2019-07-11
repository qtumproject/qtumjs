import "mocha"
import { assert } from "chai"

import { repoData, rpc, assertThrow } from "./test"
import { ContractsRepo } from "./ContractsRepo"

describe("ContractsRepo", () => {
  // don't act as sender
  const repo = new ContractsRepo(rpc, repoData)

  it("can instantiate a contract", () => {
    const contract = repo.contract("test/contracts/LogOfDependantContract.sol")

    assert.isNotNull(contract)
    assert.strictEqual(
      contract.info,
      repoData.contracts["test/contracts/LogOfDependantContract.sol"],
    )
  })

  it("can instantiate a contract with an log decoder that knows about all events", async () => {
    const contract = repo.contract("test/contracts/LogOfDependantContract.sol")

    const result = await contract.call("emitLog")

    const fooEvent = result.logs[0]!

    assert.isNotNull(fooEvent)
    assert.deepEqual(fooEvent[0], "Foo!")
    assert.deepEqual(fooEvent, {
      data: "Foo!",
      type: "LogOfDependantContractChildEvent",
    })
  })
})
