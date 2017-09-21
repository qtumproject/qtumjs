The QTUM JavaScript library for Smart Contract development.

# Install

```
npm install qtumjs
```

# Example Contract

Assuming that the following contract is deployed to the QTUM blockchain:

```solidity
pragma solidity ^0.4.11;

contract AVar {
  uint256 a;

  function setA(uint256 _a) {
    a = _a;
  }

  function getA() returns(uint256) {
    return a;
  }
}
```

You should put the ABI and address for this contract in a JSON file.

See: [aVar.json](https://github.com/hayeah/qtumjs/blob/master/example/aVar.json)

Now we want to change the contract's state with the setter `setA`, then use the reader `getA` to get the result back.

1. Create a transaction for `setA`
2. Wait for the transaction to be confirmed.
3. Call getter `setA` to read the stored value.

For testing purposes, I am running qtumd in regtest mode locally. It provides the RPC service on this URL:

```
http://howard:yeh@localhost:13889
```

The JavaScript example uses async/await (supported natively by Node 8+):

```js
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

  // Wait for transaction to confirm (wait for 1 block)
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
```