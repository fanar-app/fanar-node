import { AsyncLocalStorage } from 'async_hooks'

const storage = new AsyncLocalStorage<string>()

export const getRequestId = (): string => storage.getStore() ?? ''

export const runWithRequestId = <T>(id: string, fn: () => T): T =>
  storage.run(id, fn)
