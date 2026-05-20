import { randomUUID } from 'crypto'
import { send, sendDelete, configure as configureClient } from './client'
import { runWithRequestId } from './context'
import { buildPayload } from './payload'
import type { Payload } from './types'

// .label() and .color() must be chained synchronously — the payload is sent on the
// next microtask tick, so any await between fanar() and .label() will miss the label.
// Correct:  fanar(val).label('x')
// Wrong:    const b = fanar(val); await something(); b.label('x')  ← label missed
class FanarBuilder {
  private payload: Payload

  constructor(payload: Payload) {
    this.payload = payload
    Promise.resolve().then(() => send(this.payload))
  }

  label(l: string): this {
    this.payload.label = l
    return this
  }

  color(c: string): this {
    this.payload.color = c
    return this
  }
}

function fanar(value: unknown): FanarBuilder {
  let type: Payload['type']
  let content: unknown

  if (value instanceof Error) {
    type = 'exception'
    content = { name: value.name, message: value.message, stack: value.stack }
  } else if (typeof value === 'object' && value !== null) {
    type = 'object'
    content = value
  } else {
    type = 'log'
    content = value
  }

  return new FanarBuilder(buildPayload(type, content))
}

fanar.query = (sql: string, options: { bindings?: unknown; duration?: number } = {}): void => {
  send(buildPayload('query', { sql, bindings: options.bindings ?? null, duration: options.duration ?? 0 }))
}

fanar.measure = (label: string, duration: number): void => {
  const p = buildPayload('measure', { duration })
  p.label = label
  send(p)
}

fanar.time = (label: string): { stop: () => void } => {
  const start = Date.now()
  return { stop: () => fanar.measure(label, Date.now() - start) }
}

fanar.clear = (): Promise<void> => sendDelete()

fanar.configure = (options: { host?: string; port?: number }): void => {
  configureClient(options)
}

fanar.middleware = () =>
  (_req: unknown, _res: unknown, next: () => void): void => {
    runWithRequestId(randomUUID(), next)
  }

fanar.run = <T>(fn: () => T): T => runWithRequestId(randomUUID(), fn)

export default fanar
export { fanar }
