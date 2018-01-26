// Browser polyfill required by ethjs-abi
// https://github.com/ethjs/ethjs-abi/blob/5e2d4c3b7207111c143ca30d01d743c28cfb52f6/src/utils/index.js#L28
if (typeof Buffer === "undefined") {
  const { Buffer } = require("buffer")
  Object.assign(window, {
    Buffer,
  })
}

export * from "./abi"
export * from "./Contract"
export * from "./QtumRPC"
export * from "./Qtum"
export * from "./TxReceiptPromise"
export * from "./ethjs-abi"
