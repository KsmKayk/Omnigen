import type { Response } from 'express'
import type { EmitFn, ProgressEvent } from '../types'

export const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
}

type FlushableResponse = Response & { flush?: () => void }

export function createSSEEmitter(res: Response): EmitFn {
  const r = res as FlushableResponse
  return (event: ProgressEvent) => {
    r.write(`data: ${JSON.stringify(event)}\n\n`)
    r.flush?.()
  }
}
