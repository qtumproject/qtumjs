import axios, {
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
  CancelToken,
  CancelTokenSource,
} from "axios"
const URL = require("url-parse")

import debug from "debug"

const log = debug("qtumjs:rpc")

import { sleep } from "./sleep"

export interface IJSONRPCRequest {
  id: any
  method: string
  params: any[]
  auth?: string
}

export interface IAuthorization {
  id: string
  state: "pending" | "accepted" | "denied" | "consumed"
  request: IJSONRPCRequest
  createdAt: string
}

export interface IRPCCallOption {
  cancelToken?: CancelToken
}

export class QtumRPCRaw {
  private idNonce: number
  private _api: AxiosInstance

  constructor(private _baseURL: string) {
    this.idNonce = 0

    const url = new URL(_baseURL)

    const config: AxiosRequestConfig = {
      baseURL: url.origin,
      // don't throw on non-200 response
      validateStatus: () => true,
    }

    if (url.username !== "" && url.password !== "") {
      config.auth = {
        username: url.username,
        password: url.password,
      }
    }

    this._api = axios.create(config)
  }

  public cancelTokenSource(): CancelTokenSource {
    return axios.CancelToken.source()
  }

  public async rawCall(
    method: string,
    params: any[] = [],
    opts: IRPCCallOption = {},
  ): Promise<any> {
    const rpcCall: IJSONRPCRequest = {
      method,
      params,
      id: this.idNonce++,
    }

    log("%O", {
      method,
      params,
    })

    let res = await this.makeRPCCall(rpcCall)

    if (res.status === 402) {
      const auth: IAuthorization = res.data
      res = await this.authCall(auth.id, rpcCall)
    }

    if (res.status === 401) {
      // body is empty
      throw new Error(await res.statusText)
    }

    // 404 if method doesn't exist
    if (res.status === 404) {
      throw new Error(`unknown method: ${method}`)
    }

    if (res.status !== 200) {
      if (res.headers["content-type"] !== "application/json") {
        const body = await res.data
        throw new Error(`${res.status} ${res.statusText}\n${res.data}`)
      }

      const eresult = await res.data

      if (eresult.error) {
        const { code, message } = eresult.error
        throw new Error(`RPC Error: [${code}] ${message}`)
      } else {
        throw new Error(String(eresult))
      }
    }

    const { result } = await res.data
    return result
  }

  private makeRPCCall(rpcCall: IJSONRPCRequest): AxiosPromise<any> {
    return this._api.post("/", rpcCall)
  }

  private async authCall(
    authID: string,
    rpcCall: IJSONRPCRequest,
  ): Promise<any> {
    // long-poll an authorization until its state changes
    const res = await this._api.get(`/api/authorizations/${authID}/onchange`)

    const { data } = res

    if (res.status !== 200) {
      throw new Error(data.message)
    }

    const auth: IAuthorization = data

    if (auth.state === "denied") {
      throw new Error(`Authorization denied: ${authID}`)
    }

    if (auth.state === "accepted") {
      return this.makeRPCCall({
        ...rpcCall,
        auth: auth.id,
      })
    }
  }
}
