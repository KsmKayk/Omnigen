# Omnigen — Tasks 24–31: Frontend UI Components

> **Prerequisite:** Tasks 1–23 from previous parts must be complete.

---

### Task 24: Shared UI Components (Button, Badge, TabNav)

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Badge.tsx`
- Create: `frontend/src/components/ui/TabNav.tsx`
- Test: `frontend/__tests__/components/ui/Button.test.tsx`
- Test: `frontend/__tests__/components/ui/TabNav.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/__tests__/components/ui/Button.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../../src/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Gerar</Button>)
    expect(screen.getByRole('button', { name: 'Gerar' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Clique</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows disabled state', () => {
    render(<Button disabled>Desabilitado</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loading state with aria-busy', () => {
    render(<Button loading>Carregando</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies variant=outline styles', () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-brand-dark')
  })
})
```

Create `frontend/__tests__/components/ui/TabNav.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { TabNav } from '../../../src/components/ui/TabNav'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('TabNav', () => {
  it('renders all three tabs', () => {
    render(<TabNav />)
    expect(screen.getByText('Gerador')).toBeInTheDocument()
    expect(screen.getByText('Histórico')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })

  it('marks current tab as active', () => {
    render(<TabNav />)
    const activeLink = screen.getByText('Gerador').closest('a')
    expect(activeLink).toHaveClass('text-brand')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && pnpm test __tests__/components/ui/
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/components/ui/Button.tsx`**

```tsx
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'subtle' | 'secondary'
  loading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-button px-4 py-[13px] text-base font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

  const variants: Record<string, string> = {
    primary: 'bg-brand text-white hover:opacity-90',
    outline: 'border border-brand-dark text-brand-dark bg-white hover:bg-brand-subtle',
    subtle: 'bg-brand-subtle text-brand hover:opacity-90',
    secondary: 'bg-[rgba(148,151,169,0.08)] text-near-black hover:opacity-90',
  }

  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
      className={`${base} ${variants[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Create `frontend/src/components/ui/Badge.tsx`**

```tsx
interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'neutral'
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const styles: Record<string, string> = {
    success: 'bg-success-bg text-success-text',
    neutral: 'bg-[rgba(104,107,130,0.12)] text-[#484b5e]',
  }

  return (
    <span
      className={`inline-flex items-center rounded-badge px-2 py-0.5 text-sm font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  )
}
```

Add to `frontend/tailwind.config.ts` (extend colors block):
```typescript
'success-bg': 'rgba(20,158,97,0.16)',
'success-text': '#026b3f',
'brand-subtle': 'rgba(133,91,251,0.16)',
```

- [ ] **Step 5: Create `frontend/src/components/ui/TabNav.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Gerador', href: '/' },
  { label: 'Histórico', href: '/history' },
  { label: 'Logs', href: '/logs' },
]

export function TabNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border-gray bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-cool-gray hover:text-near-black'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 6: Run tests**

```bash
cd frontend && pnpm test __tests__/components/ui/
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/
git commit -m "feat(ui-components): add Button, Badge, and TabNav shared components"
```

---

### Task 25: Frontend Types and API Client

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/lib/api.ts`
- Test: `frontend/__tests__/lib/api.test.ts`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/lib/api.test.ts`:
```typescript
import { startGeneration, selectTitle } from '../../src/lib/api'

global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('startGeneration', () => {
  it('posts theme and videoType, returns generationId and titles', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ generationId: 'abc', titles: ['T1', 'T2', 'T3'] }),
    } as Response)

    const result = await startGeneration('Zeus', 'short')
    expect(result.generationId).toBe('abc')
    expect(result.titles).toHaveLength(3)

    expect(mockFetch).toHaveBeenCalledWith('/api/generation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'Zeus', videoType: 'short' }),
    })
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'theme is required' }),
    } as Response)

    await expect(startGeneration('', 'short')).rejects.toThrow('theme is required')
  })
})

describe('selectTitle', () => {
  it('posts titleIndex to correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ generationId: 'abc', selectedTitle: 'T1' }),
    } as Response)

    const result = await selectTitle('abc', 1)
    expect(result.selectedTitle).toBe('T1')
    expect(mockFetch).toHaveBeenCalledWith('/api/generation/abc/select-title', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ titleIndex: 1 }),
    }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/lib/api.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/types/index.ts`**

```typescript
export type VideoType = 'short' | 'long'

export type GenerationStatus =
  | 'pending'
  | 'pending_title_selection'
  | 'processing'
  | 'completed'
  | 'failed'

export type PipelineStep =
  | 'titles' | 'script' | 'images' | 'videos'
  | 'tts' | 'subtitles' | 'render' | 'thumbnails'
  | 'tags' | 'description' | 'saving' | 'completed'

export interface ProgressEvent {
  step: PipelineStep
  status: 'processing' | 'done' | 'error'
  progress: number
  message?: string
  error?: string
}

export interface StepState {
  status: 'idle' | 'processing' | 'done' | 'error'
  message?: string
  error?: string
}

export interface SceneBlock {
  sceneId: number
  description: string
  narration: string
}

export interface GenerationRecord {
  id: string
  theme: string
  videoType: VideoType
  suggestedTitles: string | null
  selectedTitle: string | null
  script: string | null
  videoPath: string | null
  thumbnailsJson: string | null
  tags: string | null
  description: string | null
  status: GenerationStatus
  error: string | null
  createdAt: number
  updatedAt: number
}

export interface LogRecord {
  id: number
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: 'backend' | 'frontend'
  contextJson: string | null
  createdAt: number
}
```

- [ ] **Step 4: Create `frontend/src/lib/api.ts`**

```typescript
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
```

- [ ] **Step 5: Run test**

```bash
cd frontend && pnpm test __tests__/lib/api.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/ frontend/src/lib/api.ts
git commit -m "feat(frontend-api): add typed API client and shared frontend types"
```

---

### Task 26: useSSE Hook

**Files:**
- Create: `frontend/src/hooks/useSSE.ts`
- Test: `frontend/__tests__/hooks/useSSE.test.ts`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/hooks/useSSE.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/hooks/useSSE.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/hooks/useSSE.ts`**

```typescript
'use client'

import { useState, useRef, useCallback } from 'react'
import type { ProgressEvent, PipelineStep, StepState } from '../types'

interface SSEState {
  isStreaming: boolean
  progress: number
  steps: Partial<Record<PipelineStep, StepState>>
  error: string | null
}

export function useSSE() {
  const [state, setState] = useState<SSEState>({
    isStreaming: false,
    progress: 0,
    steps: {},
    error: null,
  })

  const esRef = useRef<EventSource | null>(null)

  const connect = useCallback((generationId: string) => {
    esRef.current?.close()

    const es = new EventSource(`/api/generation/${generationId}/stream`)
    esRef.current = es

    setState((prev) => ({ ...prev, isStreaming: true, error: null }))

    es.onmessage = (e: MessageEvent) => {
      try {
        const event: ProgressEvent = JSON.parse(e.data)
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
          }
        })
      } catch {
        // malformed event — ignore
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
    setState({ isStreaming: false, progress: 0, steps: {}, error: null })
  }, [])

  return { ...state, connect, disconnect, reset }
}
```

- [ ] **Step 4: Run test**

```bash
cd frontend && pnpm test __tests__/hooks/useSSE.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useSSE.ts frontend/__tests__/hooks/useSSE.test.ts
git commit -m "feat(use-sse): add SSE hook for real-time pipeline progress streaming"
```

---

### Task 27: ProgressBar Component

**Files:**
- Create: `frontend/src/components/ProgressBar.tsx`
- Test: `frontend/__tests__/components/ProgressBar.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/components/ProgressBar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../../src/components/ProgressBar'
import type { StepState, PipelineStep } from '../../src/types'

const STEPS: Partial<Record<PipelineStep, StepState>> = {
  script: { status: 'done', message: 'Roteiro gerado' },
  tts: { status: 'processing', message: 'Gerando narração...' },
}

describe('ProgressBar', () => {
  it('renders progress percentage', () => {
    render(<ProgressBar progress={42} steps={STEPS} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
  })

  it('renders progress bar fill at correct width', () => {
    render(<ProgressBar progress={60} steps={STEPS} />)
    const fill = document.querySelector('[data-testid="progress-fill"]')
    expect(fill).toHaveStyle({ width: '60%' })
  })

  it('shows completed steps with checkmark', () => {
    render(<ProgressBar progress={50} steps={STEPS} />)
    const doneItems = screen.getAllByTestId('step-done')
    expect(doneItems.length).toBeGreaterThan(0)
  })

  it('shows active step with spinner', () => {
    render(<ProgressBar progress={50} steps={STEPS} />)
    expect(screen.getByTestId('step-processing')).toBeInTheDocument()
  })

  it('shows step error message', () => {
    const stepsWithError: Partial<Record<PipelineStep, StepState>> = {
      render: { status: 'error', error: 'FFmpeg not found' },
    }
    render(<ProgressBar progress={65} steps={stepsWithError} />)
    expect(screen.getByText('FFmpeg not found')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/components/ProgressBar.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/components/ProgressBar.tsx`**

```tsx
import type { PipelineStep, StepState } from '../types'

const STEP_LABELS: Record<PipelineStep, string> = {
  titles: 'Gerando títulos',
  script: 'Gerando roteiro',
  images: 'Buscando imagens',
  videos: 'Buscando vídeos',
  tts: 'Gerando narração',
  subtitles: 'Gerando legendas',
  render: 'Renderizando vídeo',
  thumbnails: 'Gerando thumbnails',
  tags: 'Gerando tags',
  description: 'Gerando descrição',
  saving: 'Salvando',
  completed: 'Concluído',
}

const ORDERED_STEPS: PipelineStep[] = [
  'script', 'images', 'videos', 'tts', 'subtitles',
  'render', 'thumbnails', 'tags', 'description', 'saving',
]

interface ProgressBarProps {
  progress: number
  steps: Partial<Record<PipelineStep, StepState>>
}

export function ProgressBar({ progress, steps }: ProgressBarProps) {
  return (
    <div className="w-full space-y-4">
      {/* Progress track */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[rgba(104,107,130,0.12)] rounded-full overflow-hidden">
          <div
            data-testid="progress-fill"
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-near-black w-10 text-right tabular-nums">
          {progress}%
        </span>
      </div>

      {/* Step list */}
      <ol className="space-y-2">
        {ORDERED_STEPS.map((step) => {
          const state = steps[step]
          if (!state) return null

          return (
            <li key={step} className="flex items-start gap-3">
              {/* Status icon */}
              <span className="mt-0.5 flex-shrink-0">
                {state.status === 'done' && (
                  <span data-testid="step-done" className="text-success">
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  </span>
                )}
                {state.status === 'processing' && (
                  <span data-testid="step-processing" className="text-brand">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </span>
                )}
                {state.status === 'error' && (
                  <span className="text-red-500">
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                  </span>
                )}
              </span>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  state.status === 'done' ? 'text-cool-gray line-through' :
                  state.status === 'processing' ? 'text-near-black' :
                  state.status === 'error' ? 'text-red-600' : 'text-silver-blue'
                }`}>
                  {STEP_LABELS[step]}
                </p>
                {state.message && state.status === 'processing' && (
                  <p className="text-xs text-silver-blue mt-0.5">{state.message}</p>
                )}
                {state.error && (
                  <p className="text-xs text-red-500 mt-0.5">{state.error}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
cd frontend && pnpm test __tests__/components/ProgressBar.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ProgressBar.tsx frontend/__tests__/components/ProgressBar.test.tsx
git commit -m "feat(progress-bar): add real-time step progress bar component"
```

---

### Task 28: GenerationForm Component

**Files:**
- Create: `frontend/src/components/GenerationForm.tsx`
- Test: `frontend/__tests__/components/GenerationForm.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/components/GenerationForm.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationForm } from '../../src/components/GenerationForm'

const mockOnSubmit = jest.fn()

describe('GenerationForm', () => {
  beforeEach(() => mockOnSubmit.mockReset())

  it('renders theme input and video type selector', () => {
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={false} />)
    expect(screen.getByPlaceholderText(/ex: zeus/i)).toBeInTheDocument()
    expect(screen.getByText('Vídeo Curto')).toBeInTheDocument()
    expect(screen.getByText('Vídeo Longo')).toBeInTheDocument()
  })

  it('calls onSubmit with theme and videoType', async () => {
    const user = userEvent.setup()
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={false} />)

    await user.type(screen.getByPlaceholderText(/ex: zeus/i), 'Cleopatra')
    fireEvent.click(screen.getByText('Vídeo Longo'))
    fireEvent.click(screen.getByRole('button', { name: /gerar/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Cleopatra', 'long')
    })
  })

  it('defaults to short video type', async () => {
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={false} />)
    await userEvent.type(screen.getByPlaceholderText(/ex: zeus/i), 'Zeus')
    fireEvent.click(screen.getByRole('button', { name: /gerar/i }))
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledWith('Zeus', 'short'))
  })

  it('does not submit when theme is empty', async () => {
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={false} />)
    fireEvent.click(screen.getByRole('button', { name: /gerar/i }))
    expect(mockOnSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/informe um tema/i)).toBeInTheDocument()
  })

  it('disables form when disabled=true', () => {
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={true} />)
    expect(screen.getByRole('button', { name: /gerar/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/components/GenerationForm.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/components/GenerationForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import type { VideoType } from '../types'

interface GenerationFormProps {
  onSubmit: (theme: string, videoType: VideoType) => void
  disabled: boolean
}

export function GenerationForm({ onSubmit, disabled }: GenerationFormProps) {
  const [theme, setTheme] = useState('')
  const [videoType, setVideoType] = useState<VideoType>('short')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!theme.trim()) {
      setError('Informe um tema para o vídeo')
      return
    }
    setError('')
    onSubmit(theme.trim(), videoType)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
      <div>
        <label htmlFor="theme" className="block text-sm font-medium text-near-black mb-1.5">
          Tema do vídeo
        </label>
        <input
          id="theme"
          type="text"
          value={theme}
          onChange={(e) => { setTheme(e.target.value); setError('') }}
          placeholder="Ex: Zeus, Cleopatra, Revolução Francesa..."
          disabled={disabled}
          className="w-full rounded-button border border-border-gray bg-white px-4 py-3 text-base text-near-black placeholder:text-silver-blue focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-near-black mb-2">
          Tipo de vídeo
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {(['short', 'long'] as const).map((type) => (
            <label
              key={type}
              className={`relative flex cursor-pointer flex-col rounded-button border-2 p-4 transition-colors ${
                videoType === type
                  ? 'border-brand bg-brand-subtle'
                  : 'border-border-gray bg-white hover:border-silver-blue'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="videoType"
                value={type}
                checked={videoType === type}
                onChange={() => setVideoType(type)}
                disabled={disabled}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-near-black">
                {type === 'short' ? 'Vídeo Curto' : 'Vídeo Longo'}
              </span>
              <span className="text-xs text-cool-gray mt-0.5">
                {type === 'short' ? '9:16 · 45–60s' : '16:9 · 10–12min'}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={disabled} className="w-full">
        Gerar Vídeo
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Run test**

```bash
cd frontend && pnpm test __tests__/components/GenerationForm.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/GenerationForm.tsx frontend/__tests__/components/GenerationForm.test.tsx
git commit -m "feat(generation-form): add theme input and video type selector component"
```

---

### Task 29: TitlePicker Component

**Files:**
- Create: `frontend/src/components/TitlePicker.tsx`
- Test: `frontend/__tests__/components/TitlePicker.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/components/TitlePicker.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { TitlePicker } from '../../src/components/TitlePicker'

const TITLES = ['Zeus: O Rei dos Deuses', 'A Ira do Olimpo', 'Trovões e Poder']
const mockOnSelect = jest.fn()

describe('TitlePicker', () => {
  beforeEach(() => mockOnSelect.mockReset())

  it('renders all 3 titles', () => {
    render(<TitlePicker titles={TITLES} onSelect={mockOnSelect} loading={false} />)
    TITLES.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument())
  })

  it('calls onSelect with correct index on click', () => {
    render(<TitlePicker titles={TITLES} onSelect={mockOnSelect} loading={false} />)
    fireEvent.click(screen.getByText('A Ira do Olimpo'))
    expect(mockOnSelect).toHaveBeenCalledWith(1)
  })

  it('highlights selected title', () => {
    render(<TitlePicker titles={TITLES} onSelect={mockOnSelect} loading={false} selectedIndex={2} />)
    const selectedCard = screen.getByText('Trovões e Poder').closest('[data-testid="title-card"]')
    expect(selectedCard).toHaveClass('border-brand')
  })

  it('shows loading state on selected title', () => {
    render(<TitlePicker titles={TITLES} onSelect={mockOnSelect} loading={true} selectedIndex={0} />)
    expect(screen.getByTestId('title-loading')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/components/TitlePicker.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/components/TitlePicker.tsx`**

```tsx
interface TitlePickerProps {
  titles: string[]
  onSelect: (index: number) => void
  loading: boolean
  selectedIndex?: number
}

export function TitlePicker({ titles, onSelect, loading, selectedIndex }: TitlePickerProps) {
  return (
    <div className="w-full space-y-3">
      <p className="text-sm font-medium text-cool-gray">
        Escolha um título para o seu vídeo
      </p>
      <ol className="space-y-2">
        {titles.map((title, i) => {
          const isSelected = selectedIndex === i
          return (
            <li key={i}>
              <button
                type="button"
                data-testid="title-card"
                onClick={() => !loading && onSelect(i)}
                disabled={loading && !isSelected}
                className={`w-full rounded-button border-2 px-5 py-4 text-left text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isSelected
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-border-gray bg-white text-near-black hover:border-silver-blue'
                } ${loading && !isSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{title}</span>
                  {isSelected && loading && (
                    <span data-testid="title-loading" className="flex-shrink-0">
                      <svg
                        className="h-4 w-4 animate-spin text-brand"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    </span>
                  )}
                  {isSelected && !loading && (
                    <svg className="h-4 w-4 flex-shrink-0 text-brand" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
cd frontend && pnpm test __tests__/components/TitlePicker.test.tsx
```
Expected: PASS

- [ ] **Step 5: Run all frontend tests**

```bash
cd frontend && pnpm test
```
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/TitlePicker.tsx frontend/__tests__/components/TitlePicker.test.tsx
git commit -m "feat(title-picker): add title selection component with loading and selected states"
```

---

### Task 30: Root Layout with Header

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Create: `frontend/src/components/AppHeader.tsx`
- Test: `frontend/__tests__/components/AppHeader.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/components/AppHeader.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { AppHeader } from '../../src/components/AppHeader'

jest.mock('next/navigation', () => ({ usePathname: () => '/' }))

describe('AppHeader', () => {
  it('renders Omnigen brand name', () => {
    render(<AppHeader />)
    expect(screen.getByText('Omnigen')).toBeInTheDocument()
  })

  it('renders all 3 navigation tabs', () => {
    render(<AppHeader />)
    expect(screen.getByText('Gerador')).toBeInTheDocument()
    expect(screen.getByText('Histórico')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/components/AppHeader.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/components/AppHeader.tsx`**

```tsx
import { TabNav } from './ui/TabNav'

export function AppHeader() {
  return (
    <header>
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-3">
        <span className="text-xl font-bold tracking-tight text-near-black">Omnigen</span>
        <span className="text-xs font-medium text-silver-blue bg-[rgba(104,107,130,0.08)] px-2 py-0.5 rounded-badge">
          beta
        </span>
      </div>
      <TabNav />
    </header>
  )
}
```

- [ ] **Step 4: Update `frontend/src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import { AppHeader } from '../components/AppHeader'
import '../styles/globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
})

export const metadata: Metadata = {
  title: 'Omnigen',
  description: 'Geração automatizada de vídeos com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={ibmPlexSans.variable}>
      <body className="bg-white text-near-black font-ui antialiased min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Run test**

```bash
cd frontend && pnpm test __tests__/components/AppHeader.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/AppHeader.tsx frontend/src/app/layout.tsx
git commit -m "feat(layout): add app header with brand name and tab navigation"
```

---

### Task 31: Frontend Logger

**Files:**
- Create: `frontend/src/lib/logger.ts`
- Test: `frontend/__tests__/lib/logger.test.ts`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/lib/logger.test.ts`:
```typescript
import { frontendLogger } from '../../src/lib/logger'
import * as api from '../../src/lib/api'

jest.mock('../../src/lib/api')
const mockPostLog = api.postFrontendLog as jest.MockedFunction<typeof api.postFrontendLog>

describe('frontendLogger', () => {
  beforeEach(() => mockPostLog.mockResolvedValue({ ok: true }))

  it('info sends log with level info', async () => {
    await frontendLogger.info('test message', { key: 'value' })
    expect(mockPostLog).toHaveBeenCalledWith('info', 'test message', { key: 'value' })
  })

  it('error sends log with level error', async () => {
    await frontendLogger.error('something failed')
    expect(mockPostLog).toHaveBeenCalledWith('error', 'something failed', undefined)
  })

  it('does not throw if API call fails', async () => {
    mockPostLog.mockRejectedValueOnce(new Error('network error'))
    await expect(frontendLogger.warn('warning')).resolves.not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/lib/logger.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/lib/logger.ts`**

```typescript
import { postFrontendLog } from './api'

type Level = 'info' | 'warn' | 'error' | 'debug'

async function log(level: Level, message: string, context?: Record<string, unknown>) {
  try {
    await postFrontendLog(level, message, context)
  } catch {
    // silently fail — never let logging break the UI
  }
}

export const frontendLogger = {
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
}
```

- [ ] **Step 4: Run test**

```bash
cd frontend && pnpm test __tests__/lib/logger.test.ts
```
Expected: PASS

- [ ] **Step 5: Run all frontend tests**

```bash
cd frontend && pnpm test
```
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/logger.ts frontend/__tests__/lib/logger.test.ts
git commit -m "feat(frontend-logger): add frontend logger that posts to backend /api/logs"
```

---

*Continue to `PLAN_1_PART_6.md` for Tasks 32–39: Pages, ResultPanel, README, and final integration.*
