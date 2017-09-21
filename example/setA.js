const { Contract, QtumRPC } = require("qtumjs")

const rpc = new QtumRPC("http://howard:yeh@localhost:13889")

async function main() {
  // Load the ABI and address of a deployed contract
  const contractInfo = require("./aVar.json")

  // Instantiate an RPC client that interacts with the contract using ABI encoding.
  const foo = new Contract(rpc, contractInfo)

  // Create a transaction that calls setA with a random integer
  const i = Math.floor(Math.random() * 100)
  console.log("setA", i)
  const receipt = await foo.send("setA", [i])

  // Wait for transaction to confirm
  console.log("txid", receipt.txid)
  console.log("waiting for transaction confirmation")
  await receipt.done(1)

  // Make an RPC call of a constant function
  const callResult = await foo.call("getA")

  return {
    // First return value
    r0: callResult[0],
    // Other metadata about the call (e.g. gas used)
    callResult,
  }
}

main().then((result) => {
  console.log("ok")
  console.log(result)
}).catch((err) => {
  console.log("err", err)
})


