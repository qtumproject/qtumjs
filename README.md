The QTUM JavaScript library for Smart Contract development.

See [documentation](https://qtumproject.github.io/qtumjs-doc/).

See [中文 API 文档](https://qtumproject.github.io/qtumjs-doc-cn/).

See [companion tutorial](https://github.com/qtumproject/qtumbook/blob/master/en/part2/erc20-js.md).

# Install

```
npm install qtumjs
```

This is a sample code snippet that transfer ERC20 tokens:

```js
import { QtumRPC } from "qtumjs"

const repoData = require("./solar.json")
const qtum = new Qtum("http://qtum:test@localhost:3889", repoData)

const myToken = qtum.contract(
  "zeppelin-solidity/contracts/token/CappedToken.sol",
)

async function transfer(fromAddr, toAddr, amount) {
  const tx = await myToken.send("transfer", [toAddr, amount], {
    senderAddress: fromAddr,
  })

  console.log("transfer tx:", tx.txid)
  console.log(tx)

  await tx.confirm(3)
  console.log("transfer confirmed")
}
```

The [full source code](https://github.com/qtumproject/qtumbook-mytoken-qtumjs-cli).

> This example uses async/await (supported natively by Node 8+).

# Running Tests

```
docker run -it --rm \
  --name qtumjs \
  -v `pwd`:/dapp \
  -p 3889:3889 \
  hayeah/qtumportal
```

Configure QTUM_RPC for deployment tool:

Enter into container:

```
docker exec -it qtumjs sh
```

Generate initial blocks:

```
qcli importprivkey cMbgxCJrTYUqgcmiC1berh5DFrtY1KeU4PXZ6NZxgenniF1mXCRk
qcli generatetoaddress 600 qUbxboqjBRp96j3La8D1RYkyqx5uQbJPoW

qcli getbalance

2000000.00000000
```

Deploy test contracts:

```
export QTUM_RPC=http://qtum:test@localhost:3889
export QTUM_SENDER=qUbxboqjBRp96j3La8D1RYkyqx5uQbJPoW

sh deploy-test-contracts.sh
```

Build and run tests:

```
npm build
npm run test
```
