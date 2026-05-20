import { randomUUID } from 'crypto'
import { getRequestId } from './context'
import { captureOrigin } from './origin'
import type { Payload } from './types'

export function buildPayload(type: Payload['type'], content: unknown): Payload {
  let serialized: string
  try {
    serialized = JSON.stringify(content)
  } catch {
    serialized = '"[unserializable]"'
  }
  return {
    id: randomUUID(),
    requestId: getRequestId(),
    type,
    label: '',
    color: '',
    content: serialized,
    origin: captureOrigin(),
    timestamp: new Date().toISOString(),
  }
}
