import { IABIMethod } from "./index"

/**
 * Build an index of a contract's ABI definitions.
 */
export class MethodMap {
  private methods: { [key: string]: IABIMethod } = {}

  constructor(_methods: IABIMethod[]) {
    const keyCollisions: Set<string> = new Set()

    for (const method of _methods) {
      if (method.type !== "function") {
        continue
      }

      const key = `${method.name}#${method.inputs.length}`

      const sig = `${method.name}(${method.inputs
        .map((input) => input.type)
        .join(",")})`

      if (this.methods[key]) {
        // Detected ambiguity for this arity. User must use method signature
        // to select the method.
        keyCollisions.add(key)
      } else {
        this.methods[key] = method
      }

      this.methods[sig] = method
    }

    for (const key of keyCollisions) {
      delete this.methods[key]
    }
  }

  /**
   * Solidity allows method name overloading. If there's no ambiguity, allow
   * the name of the method as selector. If there is ambiguity (same number
   * of arguments, different types), must use the method signature.
   *
   * Example:
   *
   *   foo(uint a, uint b)
   *
   *   The method name is `foo`.
   *   The method signature is `foo(uint, uint)`
   */
  public findMethod(
    selector: string,
    args: any[] = [],
  ): IABIMethod | undefined {
    // Find method by method signature
    const method = this.methods[selector]
    if (method) {
      return method
    }

    // Find method by method name
    const key = `${selector}#${args.length}`

    return this.methods[key]
  }
}
