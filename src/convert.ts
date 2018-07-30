import { typeBlockTags } from "./EthRPC"

const HEX_CHARACTERS = "0123456789abcdef"

function isHexString(value: string, length?: number): boolean {
  if (typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
    return false
  }

  if (length && value.length !== 2 + 2 * length) {
    return false
  }

  return true
}

export function add0xPrefix(hex: string): string {
  if (hex.indexOf("0x") === 0) {
    return hex
  }

  return `0x${hex}`
}

export function hexlify(value: number | string): string {
  if (typeof value === "number") {
    let hex = ""

    while (value) {
      // tslint:disable-next-line no-bitwise
      hex = HEX_CHARACTERS[value & 0x0f] + hex
      value = parseInt((value / 16).toString(), 10)
    }

    if (hex.length) {
      if (hex.length % 2) {
        hex = `0${hex}`
      }
      return `0x${hex}`
    }
    return "0x00"
  }

  if (value.indexOf("0x") !== 0) {
    value = `0x${value}`
  }

  if (isHexString(value)) {
    if (value.length % 2) {
      value = `0x0${value.substring(2)}`
    }
    return value
  }

  throw new Error("invalid hexlify value")
}

export function hexStripZeros(value: string): string {
  while (value.length > 3 && value.substring(0, 3) === "0x0") {
    value = `0x${value.substring(3)}`
  }
  return value
}

export function toNonNumberBlock(
  block?: typeBlockTags
): string | "latest" | "pending" | "earliest" | undefined {
  if (
    block != null &&
    (typeof block === "number" ||
      (block !== "latest" && block !== "pending" && block !== "earliest"))
  ) {
    block = hexStripZeros(hexlify(block))
  }

  return block
}
