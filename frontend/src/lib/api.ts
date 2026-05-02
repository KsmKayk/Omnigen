import type { GenerationRecord, LogRecord, VideoType } from '../types'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const data = await res.json()
  if (!res.ok) {
    const message = typeof data?.error === 'string'
      ? data.error
      : JSON.stringify(data?.error ?? 'Request failed')
    throw new Error(message)
  }
  return data as T
}

export function startGeneration(theme: string, videoType: VideoType) {
  return apiFetch<{ generationId: string; titles: string[] }>('/api/generation/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, videoType }),
  })
}

export function selectTitle(generationId: string, titleIndex: number) {
  return apiFetch<{ generationId: string; selectedTitle: string }>(
    `/api/generation/${generationId}/select-title`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titleIndex }),
    },
  )
}

export function getHistory() {
  return apiFetch<GenerationRecord[]>('/api/history')
}

export function getGeneration(id: string) {
  return apiFetch<GenerationRecord>(`/api/history/${id}`)
}

export function getLogs(limit = 100) {
  return apiFetch<LogRecord[]>(`/api/logs?limit=${limit}`)
}

export function postFrontendLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context?: Record<string, unknown>,
) {
  return apiFetch<{ ok: boolean }>('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, context }),
  })
}
