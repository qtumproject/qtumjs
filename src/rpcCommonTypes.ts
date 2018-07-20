export interface ITransactionLog {
  address: string
  topics: string[]
  data: string
}

export interface IPromiseCancel<T> extends Promise<T> {
  cancel: () => void
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): IPromiseCancel<TResult1 | TResult2>
  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): IPromiseCancel<T | TResult>
}
