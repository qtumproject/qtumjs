import "mocha"
import { assert } from "chai"

import { repoData as repoData, rpc, generateBlock, assertThrow } from "./test"
import { ContractsRepo } from "./ContractsRepo"

describe("EventListener", () => {
  // don't act as sender
  const repo = new ContractsRepo(rpc, repoData)

  it("can decode events emitted by any known contract", async () => {
    const listener = repo.eventListener()

    const contract = repo.contract("test/contracts/LogOfDependantContract.sol")

    const logPromise = listener.waitLogs({ minconf: 0 })

    const tx = await contract.send("emitLog")

    generateBlock()

    const logs = await logPromise
    // console.log("logs", JSON.stringify(logs, null, 2))

    const fooEvent = logs.entries[0]

    assert.isNotNull(fooEvent.event)
    assert.deepEqual(fooEvent.event, { data: "Foo!", type: "LogOfDependantContractChildEvent" })
  })

  // TODO ignore unknown event
  // TODO can listen for specific topic
})
