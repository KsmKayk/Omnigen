'use client'

import { useState, useRef, useCallback } from 'react'
import type { ProgressEvent, ProgressEventResult, PipelineStep, StepState } from '../types'

interface SSEState {
  isStreaming: boolean
  progress: number
  steps: Partial<Record<PipelineStep, StepState>>
  error: string | null
  result: ProgressEventResult | null
}

export function useSSE() {
  const [state, setState] = useState<SSEState>({
    isStreaming: false,
    progress: 0,
    steps: {},
    error: null,
    result: null,
  })

  const esRef = useRef<EventSource | null>(null)

  const connect = useCallback((generationId: string) => {
    esRef.current?.close()

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'
    const es = new EventSource(`${backendUrl}/api/generation/${generationId}/stream`)
    esRef.current = es

    setState((prev) => ({ ...prev, isStreaming: true, error: null }))

    es.onmessage = (e: MessageEvent) => {
      try {
        const event: ProgressEvent = JSON.parse(e.data as string)
        setState((prev) => {
          const updatedSteps: Partial<Record<PipelineStep, StepState>> = {
            ...prev.steps,
            [event.step]: {
              status: event.status === 'processing' ? 'processing'
                : event.status === 'done' ? 'done'
                : 'error',
              message: event.message,
              error: event.error,
            },
          }
          const isStreaming = event.step !== 'completed' && event.status !== 'error'
          if (!isStreaming) es.close()
          return {
            ...prev,
            isStreaming,
            progress: event.progress,
            steps: updatedSteps,
            error: event.status === 'error' ? (event.error ?? 'Unknown error') : prev.error,
            result: event.result ?? prev.result,
          }
        })
      } catch {
        // ignore malformed events
      }
    }

    es.onerror = () => {
      setState((prev) => ({ ...prev, isStreaming: false, error: 'Connection lost' }))
      es.close()
    }
  }, [])

  const disconnect = useCallback(() => {
    esRef.current?.close()
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  const reset = useCallback(() => {
    esRef.current?.close()
    setState({ isStreaming: false, progress: 0, steps: {}, error: null, result: null })
  }, [])

  return { ...state, connect, disconnect, reset }
}
