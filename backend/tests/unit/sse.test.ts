import { createSSEEmitter, sseHeaders } from '../../src/lib/sse'
import type { ProgressEvent } from '../../src/types'

process.env.OPENROUTER_API_KEY = 'test'
process.env.SERPAPI_KEY = 'test-serpapi-key'

describe('sseHeaders', () => {
  it('contains required SSE headers', () => {
    expect(sseHeaders['Content-Type']).toBe('text/event-stream')
    expect(sseHeaders['Cache-Control']).toBe('no-cache')
    expect(sseHeaders['Connection']).toBe('keep-alive')
  })
})

describe('createSSEEmitter', () => {
  it('writes correctly formatted SSE data to res', () => {
    const written: string[] = []
    const mockRes = { write: (data: string) => written.push(data) }

    const emit = createSSEEmitter(mockRes as any)
    const event: ProgressEvent = {
      step: 'script',
      status: 'processing',
      progress: 15,
      message: 'Gerando roteiro...',
    }

    emit(event)

    expect(written).toHaveLength(1)
    expect(written[0]).toMatch(/^data: /)
    expect(written[0]).toContain('"step":"script"')
    expect(written[0]).toContain('"progress":15')
    expect(written[0].endsWith('\n\n')).toBe(true)
  })
})
