import { send } from './client'
import { buildPayload } from './payload'
import { incrementQueryCount } from './request-context'

interface QueryEvent {
  query: string
  params: string
  duration: number
}

interface PrismaWithEvents {
  $on(event: 'query', callback: (e: QueryEvent) => void): void
}

// Requires PrismaClient instantiated with `log: [{ emit: 'event', level: 'query' }]`
export function withFanar<T extends PrismaWithEvents>(client: T): T {
  client.$on('query', (e: QueryEvent) => {
    incrementQueryCount()
    let bindings: unknown = null
    try { bindings = JSON.parse(e.params) } catch { /* safety net */ }
    send(buildPayload('query', { sql: e.query, bindings, duration: e.duration }))
  })
  return client
}
