import { AsyncLocalStorage } from 'async_hooks'

interface RequestState {
  queryCount: number
}

const store = new AsyncLocalStorage<RequestState>()

export const getQueryCount = (): number => store.getStore()?.queryCount ?? 0
export const incrementQueryCount = (): void => { const s = store.getStore(); if (s) s.queryCount++ }
export const runWithRequestState = <T>(fn: () => T): T => store.run({ queryCount: 0 }, fn)
