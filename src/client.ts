import type { Payload } from './types'

const DEFAULT_URL = 'http://localhost:23517'
let baseUrl = DEFAULT_URL

export function configure(options: { host?: string; port?: number }): void {
  const current = new URL(baseUrl)
  if (options.host !== undefined) current.hostname = options.host
  if (Number.isInteger(options.port) && (options.port as number) > 0) current.port = String(options.port)
  baseUrl = current.origin
}

export function send(payload: Payload): void {
  fetch(`${baseUrl}/api/payloads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err: unknown) => console.warn('[fanar] failed to send payload:', err))
}

export async function sendDelete(): Promise<void> {
  try { await fetch(`${baseUrl}/api/payloads`, { method: 'DELETE' }) } catch (err) { console.warn('[fanar] failed to clear payloads:', err) }
}
