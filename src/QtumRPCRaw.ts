
// import fetch from "isomorphic-fetch"
// import btoa from "btoa"
// import URL from "url-parse"
const fetch = require("isomorphic-fetch")
// const btoa = require("btoa")
const URL = require("url-parse")

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

export class QtumRPCRaw {
  private _origin: string
  private idNonce: number
  private _reqHeaders: { [key: string]: string }

  constructor(private _baseURL: string) {
    const url = new URL(_baseURL)
    this._origin = url.origin

    this._reqHeaders = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    }

    if (url.username !== "" || url.password !== "") {
      const authToken = btoa(`${url.username}:${url.password}`)
      this._reqHeaders.Authorization = `Basic ${authToken}`
    }
  }

  public async rawCall(method: string, ...params: any[]) {
    const rpcCall: IJSONRPCRequest = {
      method,
      params,
      id: this.idNonce++,
    }

    let res = await this.makeRPCCall(rpcCall)

    if (res.status === 402) {
      const auth: IAuthorization = await res.json()
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

    // 500 for other errors
    if (res.status === 500) {
      const { error } = await res.json()
      if (typeof error !== "undefined") {
        throw new Error(`[${error.code}] ${error.message}`)
      } else {
        throw new Error(JSON.stringify(error))
      }
    }

    const { result } = await res.json()
    return result
  }

  private makeRPCCall(rpcCall: IJSONRPCRequest): Promise<any> {
    return fetch(`${this._origin}/`, {
      method: "POST",
      headers: this._reqHeaders,
      body: JSON.stringify(rpcCall),
    })
  }

  private async authCall(authID: string, rpcCall: IJSONRPCRequest): Promise<any> {
    // Repeatedly check /authorizations/:id until resolved
    while (true) {
      const res = await fetch(`${this._origin}/api/authorizations/${authID}`)

      if (res.status === 404) {
        throw new Error(`Cannot find authorization: ${authID}`)
      }

      const auth: IAuthorization = await res.json()

      if (auth.state === "denied") {
        throw new Error(`Authorization denied: ${authID}`)
      }

      if (auth.state === "pending") {
        await sleep(1000)
        continue
      }

      if (auth.state === "accepted") {
        return this.makeRPCCall({
          ...rpcCall,
          auth: auth.id,
        })
      }
    }

  }
}
