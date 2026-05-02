import type { Response } from 'express'
import type { EmitFn, ProgressEvent } from '../types'

export const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
}

export function createSSEEmitter(res: Response): EmitFn {
  return (event: ProgressEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
    if (typeof (res as any).flush === 'function') {
      (res as any).flush()
    }
  }
}
