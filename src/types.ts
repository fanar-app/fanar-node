export interface Origin {
  file: string
  line: number
  function: string
}

export interface Payload {
  id: string
  requestId: string
  type: 'log' | 'object' | 'exception' | 'query' | 'measure' | 'request'
  label: string
  color: string
  content: string
  origin: Origin
  timestamp: string
}
