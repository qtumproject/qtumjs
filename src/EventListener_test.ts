import "mocha"
import { assert } from "chai"

import { repoData, rpc, generateBlock, assertThrow } from "./test"
import { ContractsRepo } from "./ContractsRepo"
import { IContractInfo } from "./Contract"

describe("EventListener", () => {
  // don't act as sender
  const repo = new ContractsRepo(rpc, repoData)

  // it("can decode events emitted by any known contract", async () => {
  //   const listener = repo.eventListener()

  //   const contract = repo.contract("test/contracts/LogOfDependantContract.sol")
  //   const logPromise = listener.waitLogs({ minconf: 0 })

  //   const tx = await contract.send("emitLog")

  //   generateBlock()

  //   const logs = await logPromise
  //   // console.log("logs", JSON.stringify(logs, null, 2))

  //   const fooEvent = logs.entries[0]

  //   assert.isNotNull(fooEvent.event)
  //   assert.deepEqual(fooEvent.event, {
  //     data: "Foo!",
  //     type: "LogOfDependantContractChildEvent",
  //   })
  // })

  describe("#onLog", () => {
    const contract = repo.contract("test/contracts/Logs.sol")
    const listener = repo.eventListener()

    it("can receive a log using callback", (done) => {
      contract.send("emitFooEvent", ["test!"])

      const cancelOnLog = listener.onLog(
        (entry) => {
          const fooEvent = entry.event!
          assert.deepEqual(fooEvent, { a: "test!", type: "FooEvent" })
          cancelOnLog()
          done()
        },
        { minconf: 0 },
      )

      generateBlock()
    })
  })

  // it("should leave unrecognized events unparsed", async () => {
  //   const logContractInfo: IContractInfo =
  //     repoData.contracts["test/contracts/Logs.sol"]

  //   logContractInfo.abi = logContractInfo.abi.filter(
  //     (def) => !Object.is(def.name, "BazEvent"),
  //   )

  //   const repoData2 = {
  //     contracts: { Logs: logContractInfo },
  //     libraries: {},
  //     related: {},
  //   }

  //   const repo2 = new ContractsRepo(rpc, repoData2)

  //   const logContract = repo2.contract("Logs")

  //   const listener = repo2.eventListener()

  //   const logPromise = listener.waitLogs({ minconf: 0 })
  //   const tx = logContract.send("emitMultipleEvents", ["test!"])
  //   generateBlock()

  //   const logs = await logPromise
  //   // find unrecognized BazEvent, whose topic is BazEvent
  //   const bazEvent = logs.entries.find((entry) =>
  //     Object.is(
  //       entry.topics[0],
  //       "ebe3309556157bcfc1c4e8912c38f6994609d30dc7f5fa520622bf176b9bcec3",
  //     ),
  //   )!

  //   assert.equal(logs.count, 3)
  //   assert.isNotNull(bazEvent)
  //   assert.isNull(bazEvent.event)

  //   // console.log("logs", JSON.stringify(logs, null, 2))
  // })

  describe("#onLog", () => {
    const contract = repo.contract("test/contracts/Logs.sol")
    const listener = repo.eventListener()

    it("can receive a log using callback", (done) => {
      contract.send("emitFooEvent", ["test!"])

      const cancelOnLog = listener.onLog(
        (entry) => {
          const fooEvent = entry.event!
          assert.deepEqual(fooEvent, { a: "test!", type: "FooEvent" })

          // clean up test by unsubscribing from events
          cancelOnLog()
          done()
        },
        { minconf: 0 },
      )

      generateBlock()
    })
  })

  // describe("#emitter", () => {
  //   const contract = repo.contract("test/contracts/Logs.sol")
  //   const listener = repo.eventListener()

  //   it("can receive logs using event emitter", (done) => {
  //     contract.send("emitFooEvent", ["test!"])

  //     const emitter = listener.emitter({ minconf: 0 })
  //     emitter.on("FooEvent", (entry) => {
  //       const fooEvent = entry.event!

  //       assert.deepEqual(fooEvent, { a: "test!", type: "FooEvent" })

  //       // clean up test by unsubscribing from events
  //       emitter.cancel()
  //       done()
  //     })

  //     generateBlock()
  //   })
  // })
  // TODO can listen for specific topic
})
