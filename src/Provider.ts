export interface IProvider {
  rawCall: (method: string, params?: any[], opts?: any) => Promise<any>
  cancelTokenSource: () => any
}
