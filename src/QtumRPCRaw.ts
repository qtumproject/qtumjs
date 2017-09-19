
// import fetch from "isomorphic-fetch"
// import btoa from "btoa"
// import URL from "url-parse"
const fetch = require("isomorphic-fetch")
const btoa = require("btoa")
const URL = require("url-parse")

export class QtumRPCRaw {
  private _authToken: string

  constructor(private _baseURL: string) {
    const url = new URL(_baseURL)

    // unpadded base64
    this._authToken = btoa(`${url.username}:${url.password}`)
  }

  public async rawCall(method: string, ...params: any[]) {
    const res = await fetch(this._baseURL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${this._authToken}`,
      },
      body: JSON.stringify({
        method,
        params,
        id: 0,
      }),
    })

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
      throw new Error(`[${error.code}] ${error.message}`)
    }

    const { result } = await res.json()
    return result
  }
}
