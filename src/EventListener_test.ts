import "mocha"
import { assert } from "chai"

import { repoData as repoData, rpc, generateBlock, assertThrow } from "./test"
import { ContractsRepo } from "./ContractsRepo"
import { IContractInfo } from "./Contract"

describe("EventListener<QtumRPC>", () => {
  const repo = new ContractsRepo(rpc, repoData)

  it("can decode events emitted by any known contract", async () => {
    const listener = repo.eventListener()

    const contract = repo.contract("test/contracts/LogOfDependantContract.sol")

    // generate new block first, otherwise getLogs will receive last block's logs
    await generateBlock()

    const logPromise = listener.getLogs({ minconf: 0 })
    await contract.send("emitLog")

    await generateBlock()

    const logs = await logPromise

    const fooEvent = logs.entries[0]

    assert.isNotNull(fooEvent.event)
    assert.deepEqual(fooEvent.event, { data: "Foo!", type: "LogOfDependantContractChildEvent" })
  })

  it("should leave unrecognized events unparsed", async () => {
    const logContractInfo: IContractInfo = repoData.contracts["test/contracts/Logs.sol"]

    logContractInfo.abi = logContractInfo.abi.filter((def) => !Object.is(def.name, "BazEvent"))

    const repoData2 = {
      contracts: { Logs: logContractInfo },
      libraries: {},
      related: {},
    }

    const repo2 = new ContractsRepo(rpc, repoData2)

    const logContract = repo2.contract("Logs")

    const listener = repo2.eventListener()

    // generate new block first, otherwise getLogs will receive last block's logs
    await generateBlock()

    const logPromise = listener.getLogs({ minconf: 0 })
    await logContract.send("emitMultipleEvents", ["test!"])

    await generateBlock()

    const logs = await logPromise
    // find unrecognized BazEvent, whose topic is BazEvent
    const bazEvent = logs.entries.find((entry) =>
      Object.is(entry.topics[0], "ebe3309556157bcfc1c4e8912c38f6994609d30dc7f5fa520622bf176b9bcec3")
    )!

    assert.equal(logs.count, 3)
    assert.isNotNull(bazEvent)
    assert.isNull(bazEvent.event)
  })

  describe("#onLog", () => {
    const contract = repo.contract("test/contracts/Logs.sol")
    const listener = repo.eventListener()

    it("can receive a log using callback", (done) => {
      contract.send("emitFooEvent", ["test2!"])

      // generate new block first, otherwise onlog will receive last block's logs
      generateBlock().then(() => {
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
        }, { minconf: 0 })
      })
    })
  })

  describe("#emitter", () => {
    const contract = repo.contract("test/contracts/Logs.sol")
    const listener = repo.eventListener()

    it("can receive logs using event emitter", (done) => {
      contract.send("emitFooEvent", ["test3!"])

      // generate new block first, otherwise onlog will receive last block's events
      generateBlock().then(() => {
        const emitter = listener.emitter({ minconf: 0 })
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
