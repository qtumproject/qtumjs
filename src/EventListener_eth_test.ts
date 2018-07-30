import "mocha"
import { assert } from "chai"

import { repoData as repoData, ethRpc } from "./test"
import { ContractsRepo } from "./ContractsRepo"
import { IContractInfo } from "./Contract"

describe("EventListener<EthRPC>", () => {
  const repo = new ContractsRepo(ethRpc, repoData)

  it("can decode events emitted by any known contract", async () => {
    const listener = repo.eventListener()

    const contract = repo.contract("eth_LogOfDependantContract")

    await contract.send("emitLog")

    const logs = await listener.getLogs()

    const fooEvent = logs[0]

    assert.isNotNull(fooEvent.event)
    assert.deepEqual(fooEvent.event, { data: "Foo!", type: "LogOfDependantContractChildEvent" })
  })

  it("should leave unrecognized events unparsed", async () => {
    const logContractInfo: IContractInfo = repoData.contracts.eth_Logs

    logContractInfo.abi = logContractInfo.abi.filter((def) => !Object.is(def.name, "BazEvent"))

    const repoData2 = {
      contracts: { Logs: logContractInfo },
      libraries: {},
      related: {},
    }

    const repo2 = new ContractsRepo(ethRpc, repoData2)

    const logContract = repo2.contract("Logs")

    const listener = repo2.eventListener()

    await logContract.send("emitMultipleEvents", ["test!"])

    const logs = await listener.getLogs()
    // find unrecognized BazEvent, whose topic is BazEvent
    const bazEvent = logs.find((entry) =>
      Object.is(entry.topics[0], "0xebe3309556157bcfc1c4e8912c38f6994609d30dc7f5fa520622bf176b9bcec3")
    )!

    assert.equal(logs.length, 3)
    assert.isNotNull(bazEvent)
    assert.isNull(bazEvent.event)
  })

  describe("#onLog", () => {
    const contract = repo.contract("eth_Logs")
    const listener = repo.eventListener()

    it("can receive a log using callback", (done) => {
      contract.send("emitFooEvent", ["test2!"]).then(() => {
        const cancelOnLog = listener.onLog((entry) => {
          const fooEvent = entry.event!
          try {
            assert.deepEqual(fooEvent, { a: "test2!", type: "FooEvent" })
            // clean up test by unsubscribing from events
            cancelOnLog()
            done()
          } catch (err) {
            done(err)
          }
        })
      })
    })
  })

  describe("#emitter", () => {
    const contract = repo.contract("eth_Logs")
    const listener = repo.eventListener()

    it("can receive logs using event emitter", (done) => {
      contract.send("emitFooEvent", ["test3!"]).then(() => {
        const emitter = listener.emitter()
        emitter.on("FooEvent", (entry) => {
          const fooEvent = entry.event!
          assert.deepEqual(fooEvent, { a: "test3!", type: "FooEvent" })

          // clean up test by unsubscribing from events
          emitter.cancel()
          done()
        })
      })
    })
  })
  // TODO can listen for specific topic
})
