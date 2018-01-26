import { QtumRPC } from "./QtumRPC"
import { IContractsRepoData, ContractsRepo } from "./ContractsRepo"
import { Contract } from "./Contract"

/**
 * Qtum is a factory for Contract. It is instantiated with all the ABI information,
 * as well as addresses of deployed contract.
 */
export class Qtum extends QtumRPC {
  private repo: ContractsRepo

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
   * Getting a deployed instance of Contract by name
   *
   * @param name The name of a deployed contract
   */
  public contract(name: string): Contract {
    return this.repo.contract(name)
  }
}
