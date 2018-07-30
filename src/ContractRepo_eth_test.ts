import "mocha"
import { assert } from "chai"

import { repoData, ethRpc } from "./test"
import { ContractsRepo } from "./ContractsRepo"

describe("ContractsRepo<EthRPC>", () => {
  const repo = new ContractsRepo(ethRpc, repoData)

  it("can instantiate a contract", () => {
    const contract = repo.contract("eth_LogOfDependantContract")

    assert.isNotNull(contract)
    assert.strictEqual(contract.info, repoData.contracts.eth_LogOfDependantContract)
  })

  it("can instantiate a contract with an log decoder that knows about all events", async () => {
    const contract = repo.contract("eth_LogOfDependantContract")

    const tx = await contract.send("emitLog")
    const result = await tx.confirm(0)

    const fooEvent = result.logs[0]!

    assert.isNotNull(fooEvent)
    assert.deepEqual(fooEvent[0], "Foo!")
    assert.deepEqual(fooEvent, { data: "Foo!", type: "LogOfDependantContractChildEvent" })
  })
})
