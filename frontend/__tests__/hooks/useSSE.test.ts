import { renderHook, act } from '@testing-library/react'
import { useSSE } from '../../src/hooks/useSSE'
import type { ProgressEvent } from '../../src/types'

class MockEventSource {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  url: string
  readyState = MockEventSource.OPEN
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  private listeners: Record<string, (e: MessageEvent) => void> = {}

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  addEventListener(event: string, handler: (e: MessageEvent) => void) {
    this.listeners[event] = handler
  }

  removeEventListener(event: string) {
    delete this.listeners[event]
  }

  dispatchMessage(data: object) {
    const event = new MessageEvent('message', { data: JSON.stringify(data) })
    this.onmessage?.(event)
  }

  close() {
    this.readyState = MockEventSource.CLOSED
  }

  static instances: MockEventSource[] = []
  static reset() { MockEventSource.instances = [] }
}

;(global as any).EventSource = MockEventSource

describe('useSSE', () => {
  beforeEach(() => MockEventSource.reset())

  it('starts in idle state', () => {
    const { result } = renderHook(() => useSSE())
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.steps).toEqual({})
  })

  it('opens EventSource and updates progress on message', async () => {
    const { result } = renderHook(() => useSSE())

    act(() => result.current.connect('gen1'))

    expect(MockEventSource.instances).toHaveLength(1)
    expect(MockEventSource.instances[0].url).toContain('/api/generation/gen1/stream')

    const event: ProgressEvent = { step: 'script', status: 'processing', progress: 15, message: 'Gerando roteiro...' }

    act(() => MockEventSource.instances[0].dispatchMessage(event))

    expect(result.current.progress).toBe(15)
    expect(result.current.steps['script']?.status).toBe('processing')
  })

  it('sets isStreaming to false on completed event', () => {
    const { result } = renderHook(() => useSSE())
    act(() => result.current.connect('gen1'))

    act(() => MockEventSource.instances[0].dispatchMessage({
      step: 'completed', status: 'done', progress: 100,
    }))

    expect(result.current.isStreaming).toBe(false)
    expect(result.current.progress).toBe(100)
  })

  it('disconnect closes EventSource', () => {
    const { result } = renderHook(() => useSSE())
    act(() => result.current.connect('gen1'))
    act(() => result.current.disconnect())
    expect(MockEventSource.instances[0].readyState).toBe(MockEventSource.CLOSED)
  })
})
