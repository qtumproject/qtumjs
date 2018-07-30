import { EthRPC } from "./EthRPC"
import { IContractsRepoData, ContractsRepo } from "./ContractsRepo"
import { Contract } from "./Contract"

/**
 * The `Ethereum` class is an instance of the `qtumjs` API.
 *
 * @param providerURL URL of the ethereum RPC service.
 * @param repoData Information about Solidity contracts.
 */
export class Ethereum extends EthRPC {
  private repo: ContractsRepo<EthRPC>

  constructor(providerURL: string, repoData?: IContractsRepoData) {
    super(providerURL)
    this.repo = new ContractsRepo(this, {
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
  public contract(name: string): Contract<EthRPC> {
    return this.repo.contract(name)
  }
}
