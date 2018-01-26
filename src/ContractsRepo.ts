import { IContractInfo, Contract } from "./Contract"
import { IABIMethod } from "./ethjs-abi"
import { QtumRPC } from "./QtumRPC"
import { ContractLogDecoder } from "./abi";

export interface IABIDefs {
  [key: string]: {
    abi: IABIMethod[],
  }
}

export interface IContractsRepoData {
  // deployed contracts
  contracts: {
    [key: string]: IContractInfo,
  },

  libraries: {
    [key: string]: {
      abi: IABIMethod[],
    },
  }

  related: {
    [key: string]: {
      abi: IABIMethod[],
    },
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

  constructor(private qtum: QtumRPC, private repoData: IContractsRepoData) {
    const eventABIs = this.allEventABIs()
    this.logDecoder = new ContractLogDecoder(eventABIs)
  }

  public contract(name: string): Contract {
    const info = this.repoData.contracts[name]
    if (!info) {
      throw new Error(`cannot find contract: ${name}`)
    }

    // Instantiate the contract with a log decoder that can handle all known events
    return new Contract(this.qtum, info, this.logDecoder)
  }

  /**
   *  Combine all known event ABIs into one single array
   */
  private allEventABIs(): IABIMethod[] {
    const allEventABIs: IABIMethod[] = []

    const {
      contracts,
      libraries,
      related,
    } = this.repoData

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
