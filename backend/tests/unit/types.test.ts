import type { VideoType, ProgressEvent, PipelineStep, GenerationStatus, EmitFn } from '../../src/types'

describe('types', () => {
  it('VideoType accepts short and long', () => {
    const a: VideoType = 'short'
    const b: VideoType = 'long'
    expect(a).toBe('short')
    expect(b).toBe('long')
  })

  it('ProgressEvent has required fields', () => {
    const event: ProgressEvent = {
      step: 'script',
      status: 'processing',
      progress: 15,
      message: 'Gerando roteiro...',
    }
    expect(event.progress).toBe(15)
    expect(event.step).toBe('script')
  })

  it('EmitFn is callable with ProgressEvent', () => {
    const received: ProgressEvent[] = []
    const emit: EmitFn = (e) => received.push(e)
    emit({ step: 'tts', status: 'done', progress: 55 })
    expect(received).toHaveLength(1)
    expect(received[0].step).toBe('tts')
  })
})
