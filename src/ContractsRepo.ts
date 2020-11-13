import { IContractInfo, Contract } from "./Contract"
import { IABIMethod } from "./ethjs-abi"
import { QtumRPC } from "./QtumRPC"
import { ContractLogDecoder } from "./abi"
import { EventListener } from "./EventListener"

export interface IABIDefs {
  [key: string]: {
    abi: IABIMethod[]
  }
}

/**
 * Information about contracts
 */
export interface IContractsRepoData {
  /**
   * Information about deployed contracts
   */
  contracts: {
    [key: string]: IContractInfo
  }

  /**
   * Information about deployed libraries
   */
  libraries: {
    [key: string]: IContractInfo
  }

  /**
   * Information of contracts referenced by deployed contract/libraries, but not deployed
   */
  related: {
    [key: string]: {
      abi: IABIMethod[]
    }
  }
}

/**
 * ContractsRepo contains the ABI definitions of all known contracts
 */
export class ContractsRepo {
  /**
   * A logDecoder that knows about events defined in all known contracts.
   */
  public logDecoder: ContractLogDecoder

  constructor(private rpc: QtumRPC, private repoData: IContractsRepoData) {
    const eventABIs = this.allEventABIs()
    this.logDecoder = new ContractLogDecoder(eventABIs)
  }

  public contract(name: string, info?: IContractInfo): Contract {

    if (info == null) {
      info = this.repoData.contracts[name]
      if (!info) {
        throw new Error(`cannot find contract: ${name}`)
      }
    }
    
    // Instantiate the contract with a log decoder that can handle all known events
    return new Contract(this.rpc, info, { logDecoder: this.logDecoder })
  }

  public eventListener(): EventListener {
    return new EventListener(this.rpc, this.logDecoder)
  }

  /**
   *  Combine all known event ABIs into one single array
   */
  private allEventABIs(): IABIMethod[] {
    const allEventABIs: IABIMethod[] = []

    const { contracts, libraries, related } = this.repoData

    if (contracts) {
      mergeDefs(contracts)
    }

    if (libraries) {
      mergeDefs(libraries)
    }

    if (related) {
      mergeDefs(related)
    }

    return allEventABIs

    // inner utility function for allEventABIs
    function mergeDefs(abiDefs: IABIDefs) {
      for (const key of Object.keys(abiDefs)) {
        const defs = abiDefs[key].abi

        for (const def of defs) {
          if (def.type === "event") {
            allEventABIs.push(def)
          }
        }
      }
    }
  }
}
