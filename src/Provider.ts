export interface IProvider<T> {
  rawCall: (method: string, params?: any[], opts?: any) => Promise<T>
  cancelTokenSource: () => any
}
