import type { Origin } from './types'

export function captureOrigin(): Origin {
  const lines = (new Error().stack ?? '').split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('at ')) continue
    if (line.includes('node_modules')) continue
    if (/[\\/](client|origin|fanar\.decorator|fanar\.interceptor|fanar\.module|prisma\.adapter|typeorm\.adapter|request-context)\.[jt]s/.test(line)) continue

    const withFn = trimmed.match(/^at\s+(.+?)\s+\((.+):(\d+):\d+\)$/)
    if (withFn) return { function: withFn[1], file: withFn[2], line: +withFn[3] }

    const bare = trimmed.match(/^at\s+(.+):(\d+):\d+$/)
    if (bare) return { function: '', file: bare[1], line: +bare[2] }
  }

  return { file: '', line: 0, function: '' }
}
