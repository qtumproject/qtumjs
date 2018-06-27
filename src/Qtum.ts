import { IProvider } from "./Provider"
import { QtumRPC } from "./QtumRPC"
import { QtumRPCRaw } from "./QtumRPCRaw"
import { IContractsRepoData, ContractsRepo } from "./ContractsRepo"
import { Contract } from "./Contract"

/**
 * The `Qtum` class is an instance of the `qtumjs` API.
 *
 * @param providerURL URL of the qtumd RPC service.
 * @param repoData Information about Solidity contracts.
 */
export class Qtum {
  private repo: ContractsRepo
  private rawRpc: QtumRPC

  constructor(providerURL: string, repoData?: IContractsRepoData) {
    const provider: IProvider<any> = new QtumRPCRaw(providerURL)

    this.rawRpc = new QtumRPC(provider)
    this.repo = new ContractsRepo(this.rawRpc, {
      // massage the repoData by providing empty default properties
      contracts: {},
      libraries: {},
      related: {},
      ...repoData,
    })
  }

  /**
   * A factory method to instantiate a `Contract` instance using the ABI
   * definitions and address found in `repoData`. The Contract instance is
   * configured with an event log decoder that can decode all known event types
   * found in `repoData`.
   *
   * @param name The name of a deployed contract
   */
  public contract(name: string): Contract {
    return this.repo.contract(name)
  }
}
