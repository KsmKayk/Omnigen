# Omnigen — Tasks 32–39: Pages, ResultPanel, README + Final Integration

> **Prerequisite:** Tasks 1–31 from all previous parts must be complete.

---

### Task 32: ResultPanel Component

**Files:**
- Create: `frontend/src/components/ResultPanel.tsx`
- Test: `frontend/__tests__/components/ResultPanel.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/components/ResultPanel.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { ResultPanel } from '../../src/components/ResultPanel'

const PROPS = {
  title: 'Zeus: O Rei dos Deuses',
  videoPath: '/api/generation/gen1/video',
  thumbnails: [
    '/api/generation/gen1/thumb1',
    '/api/generation/gen1/thumb2',
    '/api/generation/gen1/thumb3',
  ],
  tags: ['Zeus', 'mitologia', 'deuses gregos'],
  description: 'Descubra os segredos de Zeus, rei do Olimpo.',
}

describe('ResultPanel', () => {
  it('renders the video title', () => {
    render(<ResultPanel {...PROPS} />)
    expect(screen.getByText('Zeus: O Rei dos Deuses')).toBeInTheDocument()
  })

  it('renders a video element with correct src', () => {
    render(<ResultPanel {...PROPS} />)
    const video = screen.getByTestId('result-video') as HTMLVideoElement
    expect(video).toBeInTheDocument()
    expect(video.src).toContain('/api/generation/gen1/video')
  })

  it('renders all 3 thumbnails', () => {
    render(<ResultPanel {...PROPS} />)
    const thumbs = screen.getAllByTestId('result-thumbnail')
    expect(thumbs).toHaveLength(3)
  })

  it('renders all tags as badges', () => {
    render(<ResultPanel {...PROPS} />)
    expect(screen.getByText('Zeus')).toBeInTheDocument()
    expect(screen.getByText('mitologia')).toBeInTheDocument()
    expect(screen.getByText('deuses gregos')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<ResultPanel {...PROPS} />)
    expect(screen.getByText(PROPS.description)).toBeInTheDocument()
  })

  it('renders a download link for the video', () => {
    render(<ResultPanel {...PROPS} />)
    const link = screen.getByRole('link', { name: /baixar vídeo/i })
    expect(link).toHaveAttribute('href', PROPS.videoPath)
    expect(link).toHaveAttribute('download')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/components/ResultPanel.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/components/ResultPanel.tsx`**

```tsx
import { Badge } from './ui/Badge'

interface ResultPanelProps {
  title: string
  videoPath: string
  thumbnails: string[]
  tags: string[]
  description: string
}

export function ResultPanel({ title, videoPath, thumbnails, tags, description }: ResultPanelProps) {
  return (
    <div className="w-full space-y-8">
      {/* Title */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-silver-blue mb-1">
          Título do vídeo
        </p>
        <h2 className="text-2xl font-bold text-near-black leading-tight">{title}</h2>
      </div>

      {/* Video player */}
      <div className="rounded-card overflow-hidden shadow-subtle border border-border-gray bg-near-black">
        <video
          data-testid="result-video"
          src={videoPath}
          controls
          className="w-full"
          preload="metadata"
        />
      </div>

      {/* Download */}
      <a
        href={videoPath}
        download
        className="inline-flex items-center gap-2 rounded-button border border-brand-dark px-4 py-[13px] text-base font-medium text-brand-dark hover:bg-brand-subtle transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z" />
        </svg>
        Baixar vídeo
      </a>

      {/* Thumbnails */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-silver-blue mb-3">
          Thumbnails
        </p>
        <div className="grid grid-cols-3 gap-3">
          {thumbnails.map((src, i) => (
            <div key={i} className="rounded-card overflow-hidden border border-border-gray shadow-micro">
              <img
                data-testid="result-thumbnail"
                src={src}
                alt={`Thumbnail ${i + 1}`}
                className="w-full aspect-video object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="rounded-card border border-border-gray bg-white p-5 shadow-micro">
        <p className="text-xs font-medium uppercase tracking-wider text-silver-blue mb-2">
          Descrição
        </p>
        <p className="text-base text-near-black leading-relaxed">{description}</p>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-silver-blue mb-3">
          Tags sugeridas
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="neutral">{tag}</Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
cd frontend && pnpm test __tests__/components/ResultPanel.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ResultPanel.tsx frontend/__tests__/components/ResultPanel.test.tsx
git commit -m "feat(result-panel): add video result panel with player, thumbnails, tags, and description"
```

---

### Task 33: Main Generation Page (page.tsx)

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Test: `frontend/__tests__/app/page.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/app/page.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '../../src/app/page'
import * as api from '../../src/lib/api'

jest.mock('../../src/lib/api')
jest.mock('../../src/hooks/useSSE', () => ({
  useSSE: () => ({
    isStreaming: false,
    progress: 0,
    steps: {},
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    reset: jest.fn(),
  }),
}))

const mockStartGeneration = api.startGeneration as jest.MockedFunction<typeof api.startGeneration>
const mockSelectTitle = api.selectTitle as jest.MockedFunction<typeof api.selectTitle>

describe('Home page', () => {
  beforeEach(() => {
    mockStartGeneration.mockReset()
    mockSelectTitle.mockReset()
  })

  it('shows GenerationForm initially', () => {
    render(<Home />)
    expect(screen.getByPlaceholderText(/ex: zeus/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gerar vídeo/i })).toBeInTheDocument()
  })

  it('shows title picker after successful generation start', async () => {
    mockStartGeneration.mockResolvedValueOnce({
      generationId: 'gen1',
      titles: ['Título 1', 'Título 2', 'Título 3'],
    })

    render(<Home />)
    await userEvent.type(screen.getByPlaceholderText(/ex: zeus/i), 'Zeus')
    fireEvent.click(screen.getByRole('button', { name: /gerar vídeo/i }))

    await waitFor(() => {
      expect(screen.getByText('Título 1')).toBeInTheDocument()
      expect(screen.getByText('Título 2')).toBeInTheDocument()
      expect(screen.getByText('Título 3')).toBeInTheDocument()
    })
  })

  it('shows error message when API fails', async () => {
    mockStartGeneration.mockRejectedValueOnce(new Error('API Key inválida'))

    render(<Home />)
    await userEvent.type(screen.getByPlaceholderText(/ex: zeus/i), 'Zeus')
    fireEvent.click(screen.getByRole('button', { name: /gerar vídeo/i }))

    await waitFor(() => {
      expect(screen.getByText(/API Key inválida/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/app/page.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Update `frontend/src/app/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { GenerationForm } from '../components/GenerationForm'
import { TitlePicker } from '../components/TitlePicker'
import { ProgressBar } from '../components/ProgressBar'
import { ResultPanel } from '../components/ResultPanel'
import { useSSE } from '../hooks/useSSE'
import { startGeneration, selectTitle } from '../lib/api'
import { frontendLogger } from '../lib/logger'
import type { VideoType } from '../types'

type PageState =
  | { phase: 'idle' }
  | { phase: 'loading_titles' }
  | { phase: 'title_selection'; generationId: string; titles: string[] }
  | { phase: 'generating'; generationId: string; selectedTitle: string }
  | { phase: 'completed'; generationId: string; selectedTitle: string; videoPath: string; thumbnails: string[]; tags: string[]; description: string }
  | { phase: 'error'; message: string }

export default function Home() {
  const [state, setState] = useState<PageState>({ phase: 'idle' })
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | undefined>()
  const sse = useSSE()

  async function handleFormSubmit(theme: string, videoType: VideoType) {
    setState({ phase: 'loading_titles' })
    sse.reset()

    try {
      const { generationId, titles } = await startGeneration(theme, videoType)
      await frontendLogger.info('titles generated', { generationId, count: titles.length })
      setState({ phase: 'title_selection', generationId, titles })
    } catch (err) {
      const message = (err as Error).message
      await frontendLogger.error('title generation failed', { message })
      setState({ phase: 'error', message })
    }
  }

  async function handleTitleSelect(index: number) {
    if (state.phase !== 'title_selection') return
    setSelectedTitleIndex(index)

    try {
      const { generationId, selectedTitle } = await selectTitle(state.generationId, index)
      setState({ phase: 'generating', generationId, selectedTitle })
      sse.connect(generationId)
    } catch (err) {
      setState({ phase: 'error', message: (err as Error).message })
    }
  }

  const isFormDisabled = state.phase === 'loading_titles' || state.phase === 'generating'

  return (
    <div className="space-y-10">
      {/* Intro */}
      {state.phase === 'idle' && (
        <div className="text-center space-y-3 pb-4">
          <h1 className="text-4xl font-bold tracking-tight text-near-black">
            Gere vídeos com IA
          </h1>
          <p className="text-lg text-cool-gray max-w-lg mx-auto">
            Digite um tema e o Omnigen cria roteiro, narração, imagens e vídeo completo.
          </p>
        </div>
      )}

      {/* Generation form — always visible */}
      <div className="max-w-lg mx-auto">
        <GenerationForm onSubmit={handleFormSubmit} disabled={isFormDisabled} />
      </div>

      {/* Loading titles */}
      {state.phase === 'loading_titles' && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3 text-cool-gray">
            <svg className="h-5 w-5 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Gerando sugestões de título...</span>
          </div>
        </div>
      )}

      {/* Title selection */}
      {state.phase === 'title_selection' && (
        <div className="max-w-lg mx-auto">
          <TitlePicker
            titles={state.titles}
            onSelect={handleTitleSelect}
            loading={false}
            selectedIndex={selectedTitleIndex}
          />
        </div>
      )}

      {/* Generation progress */}
      {state.phase === 'generating' && (
        <div className="max-w-lg mx-auto space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-silver-blue mb-1">Título selecionado</p>
            <p className="text-base font-semibold text-near-black">{state.selectedTitle}</p>
          </div>
          <ProgressBar progress={sse.progress} steps={sse.steps} />
          {sse.error && (
            <div className="rounded-button border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {sse.error}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {state.phase === 'error' && (
        <div className="max-w-lg mx-auto">
          <div className="rounded-button border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <p className="font-medium">Ocorreu um erro</p>
            <p className="mt-1">{state.message}</p>
            <button
              onClick={() => setState({ phase: 'idle' })}
              className="mt-3 text-brand underline text-sm font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {state.phase === 'completed' && (
        <div className="max-w-3xl mx-auto">
          <ResultPanel
            title={state.selectedTitle}
            videoPath={state.videoPath}
            thumbnails={state.thumbnails}
            tags={state.tags}
            description={state.description}
          />
          <div className="mt-8 text-center">
            <button
              onClick={() => { setState({ phase: 'idle' }); sse.reset() }}
              className="text-brand underline text-sm font-medium"
            >
              Gerar outro vídeo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test**

```bash
cd frontend && pnpm test __tests__/app/page.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/page.tsx frontend/__tests__/app/page.test.tsx
git commit -m "feat(home-page): assemble generation flow with form, title picker, progress, and result"
```

---

### Task 34: History Page

**Files:**
- Create: `frontend/src/components/HistoryList.tsx`
- Create: `frontend/src/app/history/page.tsx`
- Test: `frontend/__tests__/components/HistoryList.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/components/HistoryList.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { HistoryList } from '../../src/components/HistoryList'
import type { GenerationRecord } from '../../src/types'

const RECORDS: GenerationRecord[] = [
  {
    id: 'gen1',
    theme: 'Zeus',
    videoType: 'short',
    suggestedTitles: '["T1","T2","T3"]',
    selectedTitle: 'Zeus: O Rei dos Deuses',
    script: null,
    videoPath: '/storage/output/gen1/video.mp4',
    thumbnailsJson: '["/t1.jpg"]',
    tags: '["Zeus"]',
    description: 'Descrição do vídeo.',
    status: 'completed',
    error: null,
    createdAt: 1700000000000,
    updatedAt: 1700000001000,
  },
  {
    id: 'gen2',
    theme: 'Cleopatra',
    videoType: 'long',
    suggestedTitles: null,
    selectedTitle: null,
    script: null,
    videoPath: null,
    thumbnailsJson: null,
    tags: null,
    description: null,
    status: 'failed',
    error: 'FFmpeg not found',
    createdAt: 1700000002000,
    updatedAt: 1700000003000,
  },
]

describe('HistoryList', () => {
  it('renders both records', () => {
    render(<HistoryList records={RECORDS} />)
    expect(screen.getByText('Zeus')).toBeInTheDocument()
    expect(screen.getByText('Cleopatra')).toBeInTheDocument()
  })

  it('shows completed badge for completed records', () => {
    render(<HistoryList records={RECORDS} />)
    expect(screen.getByText('Concluído')).toBeInTheDocument()
  })

  it('shows failed badge for failed records', () => {
    render(<HistoryList records={RECORDS} />)
    expect(screen.getByText('Falhou')).toBeInTheDocument()
  })

  it('shows empty state when no records', () => {
    render(<HistoryList records={[]} />)
    expect(screen.getByText(/nenhum vídeo gerado/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/components/HistoryList.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/components/HistoryList.tsx`**

```tsx
import { Badge } from './ui/Badge'
import type { GenerationRecord } from '../types'

interface HistoryListProps {
  records: GenerationRecord[]
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

export function HistoryList({ records }: HistoryListProps) {
  if (records.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-cool-gray text-base">Nenhum vídeo gerado ainda.</p>
        <p className="text-silver-blue text-sm mt-1">
          Volte para a aba Gerador e crie seu primeiro vídeo.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {records.map((record) => (
        <li key={record.id} className="rounded-card border border-border-gray bg-white p-5 shadow-micro">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-near-black truncate">
                {record.selectedTitle ?? record.theme}
              </p>
              <p className="text-sm text-silver-blue mt-0.5">
                {record.theme} · {record.videoType === 'short' ? 'Vídeo Curto' : 'Vídeo Longo'} · {formatDate(record.createdAt)}
              </p>
              {record.error && (
                <p className="text-xs text-red-500 mt-1">{record.error}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              {record.status === 'completed' && (
                <Badge variant="success">Concluído</Badge>
              )}
              {record.status === 'failed' && (
                <span className="inline-flex items-center rounded-badge bg-red-50 px-2 py-0.5 text-sm font-medium text-red-700">
                  Falhou
                </span>
              )}
              {(record.status === 'processing' || record.status === 'pending') && (
                <Badge variant="neutral">Em andamento</Badge>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: Create `frontend/src/app/history/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { HistoryList } from '../../components/HistoryList'
import { getHistory } from '../../lib/api'
import type { GenerationRecord } from '../../types'

export default function HistoryPage() {
  const [records, setRecords] = useState<GenerationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHistory()
      .then(setRecords)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-near-black">Histórico</h1>
        <p className="text-cool-gray text-sm mt-1">Todos os vídeos gerados nesta sessão.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <svg className="h-5 w-5 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && <HistoryList records={records} />}
    </div>
  )
}
```

- [ ] **Step 5: Run test**

```bash
cd frontend && pnpm test __tests__/components/HistoryList.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/HistoryList.tsx frontend/src/app/history/
git commit -m "feat(history-page): add history page with generation records list"
```

---

### Task 35: Logs Page

**Files:**
- Create: `frontend/src/components/LogViewer.tsx`
- Create: `frontend/src/app/logs/page.tsx`
- Test: `frontend/__tests__/components/LogViewer.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/__tests__/components/LogViewer.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LogViewer } from '../../src/components/LogViewer'
import type { LogRecord } from '../../src/types'

const LOGS: LogRecord[] = [
  { id: 1, level: 'info', message: 'Server started', source: 'backend', contextJson: null, createdAt: 1700000000000 },
  { id: 2, level: 'error', message: 'FFmpeg not found', source: 'backend', contextJson: '{"path":"/usr/bin/ffmpeg"}', createdAt: 1700000001000 },
  { id: 3, level: 'info', message: 'Title picker shown', source: 'frontend', contextJson: null, createdAt: 1700000002000 },
]

describe('LogViewer', () => {
  it('renders all log entries', () => {
    render(<LogViewer logs={LOGS} />)
    expect(screen.getByText('Server started')).toBeInTheDocument()
    expect(screen.getByText('FFmpeg not found')).toBeInTheDocument()
    expect(screen.getByText('Title picker shown')).toBeInTheDocument()
  })

  it('filters logs by search term', () => {
    render(<LogViewer logs={LOGS} />)
    fireEvent.change(screen.getByPlaceholderText(/pesquisar/i), { target: { value: 'FFmpeg' } })
    expect(screen.getByText('FFmpeg not found')).toBeInTheDocument()
    expect(screen.queryByText('Server started')).not.toBeInTheDocument()
  })

  it('filters logs by level', () => {
    render(<LogViewer logs={LOGS} />)
    fireEvent.change(screen.getByRole('combobox', { name: /nível/i }), { target: { value: 'error' } })
    expect(screen.getByText('FFmpeg not found')).toBeInTheDocument()
    expect(screen.queryByText('Server started')).not.toBeInTheDocument()
  })

  it('filters logs by source', () => {
    render(<LogViewer logs={LOGS} />)
    fireEvent.change(screen.getByRole('combobox', { name: /origem/i }), { target: { value: 'frontend' } })
    expect(screen.getByText('Title picker shown')).toBeInTheDocument()
    expect(screen.queryByText('Server started')).not.toBeInTheDocument()
  })

  it('shows empty state when no logs match filter', () => {
    render(<LogViewer logs={LOGS} />)
    fireEvent.change(screen.getByPlaceholderText(/pesquisar/i), { target: { value: 'xyznonexistent' } })
    expect(screen.getByText(/nenhum log encontrado/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/components/LogViewer.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/components/LogViewer.tsx`**

```tsx
'use client'

import { useState, useMemo } from 'react'
import type { LogRecord } from '../types'

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-blue-600 bg-blue-50',
  warn: 'text-amber-600 bg-amber-50',
  error: 'text-red-600 bg-red-50',
  debug: 'text-cool-gray bg-[rgba(104,107,130,0.08)]',
}

interface LogViewerProps {
  logs: LogRecord[]
  onRefresh?: () => void
}

export function LogViewer({ logs, onRefresh }: LogViewerProps) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = !search || log.message.toLowerCase().includes(search.toLowerCase())
      const matchesLevel = !levelFilter || log.level === levelFilter
      const matchesSource = !sourceFilter || log.source === sourceFilter
      return matchesSearch && matchesLevel && matchesSource
    })
  }, [logs, search, levelFilter, sourceFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar nas mensagens..."
          className="flex-1 min-w-48 rounded-button border border-border-gray px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <select
          aria-label="Nível"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-button border border-border-gray px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">Todos os níveis</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
        <select
          aria-label="Origem"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-button border border-border-gray px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">Todas as origens</option>
          <option value="backend">Backend</option>
          <option value="frontend">Frontend</option>
        </select>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="rounded-button border border-border-gray px-3 py-2 text-sm text-cool-gray hover:text-near-black transition-colors"
          >
            Atualizar
          </button>
        )}
      </div>

      {/* Log count */}
      <p className="text-xs text-silver-blue">
        {filtered.length} de {logs.length} {logs.length === 1 ? 'entrada' : 'entradas'}
      </p>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-cool-gray text-sm">Nenhum log encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <ul className="space-y-1 font-mono text-xs">
          {filtered.map((log) => (
            <li
              key={log.id}
              className="flex items-start gap-3 rounded border border-border-gray p-3"
            >
              <span className={`flex-shrink-0 rounded px-1.5 py-0.5 font-semibold uppercase ${LEVEL_COLORS[log.level] ?? ''}`}>
                {log.level}
              </span>
              <span className="flex-shrink-0 text-silver-blue">
                {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
              </span>
              <span className="flex-shrink-0 text-silver-blue">
                [{log.source}]
              </span>
              <span className="text-near-black break-all">{log.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `frontend/src/app/logs/page.tsx`**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { LogViewer } from '../../components/LogViewer'
import { getLogs } from '../../lib/api'
import type { LogRecord } from '../../types'

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(() => {
    setLoading(true)
    getLogs(200)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-near-black">Logs</h1>
        <p className="text-cool-gray text-sm mt-1">
          Logs do backend e do frontend em tempo real.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <svg className="h-5 w-5 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}

      {!loading && <LogViewer logs={logs} onRefresh={fetchLogs} />}
    </div>
  )
}
```

- [ ] **Step 5: Run test**

```bash
cd frontend && pnpm test __tests__/components/LogViewer.test.tsx
```
Expected: PASS

- [ ] **Step 6: Run all frontend tests**

```bash
cd frontend && pnpm test
```
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/LogViewer.tsx frontend/src/app/logs/
git commit -m "feat(logs-page): add log viewer with search, level, and source filters"
```

---

### Task 36: Backend Static File Serving for Generated Assets

**Files:**
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/integration/static-files.test.ts`:
```typescript
import request from 'supertest'
import fs from 'fs'
import path from 'path'
import { createApp } from '../../src/server'

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'
process.env.STORAGE_PATH = path.join(__dirname, 'tmp_storage')

describe('static file serving', () => {
  const tmpDir = path.join(__dirname, 'tmp_storage', 'output', 'gen1')

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(path.join(tmpDir, 'video.mp4'), 'fake-video-content')
  })

  afterAll(() => {
    fs.rmSync(path.join(__dirname, 'tmp_storage'), { recursive: true, force: true })
  })

  it('serves files from storage/output via /output route', async () => {
    const app = createApp()
    const res = await request(app).get('/output/gen1/video.mp4')
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/integration/static-files.test.ts
```
Expected: FAIL

- [ ] **Step 3: Update `backend/src/server.ts` — add static serving**

Add after the existing route registrations, before the error handler:
```typescript
import path from 'path'
import express from 'express'

// inside createApp(), after route registrations:
app.use('/output', express.static(path.join(config.STORAGE_PATH, 'output')))
```

Full updated `backend/src/server.ts`:
```typescript
import express from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import path from 'path'
import { logger } from './lib/logger'
import { generationRouter } from './routes/generation'
import { historyRouter } from './routes/history'
import { logsRouter } from './routes/logs'
import { config } from './config'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(pinoHttp({ logger }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/generation', generationRouter)
  app.use('/api/history', historyRouter)
  app.use('/api/logs', logsRouter)

  app.use('/output', express.static(path.join(config.STORAGE_PATH, 'output')))

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'unhandled error')
    res.status(500).json({ error: err.message })
  })

  return app
}

if (require.main === module) {
  const app = createApp()
  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'server started')
  })
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/integration/static-files.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/server.ts backend/tests/integration/static-files.test.ts
git commit -m "feat(server): serve generated video and thumbnail files via /output static route"
```

---

### Task 37: Startup Validation (DB migrations + storage dirs)

**Files:**
- Create: `backend/src/startup.ts`
- Modify: `backend/src/server.ts` (call runStartup in listen block)

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/startup.test.ts`:
```typescript
import fs from 'fs'
import path from 'path'
import { prepareStorageDirs } from '../../src/startup'

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const TMP = path.join(__dirname, 'tmp_startup_test')
process.env.STORAGE_PATH = TMP

describe('prepareStorageDirs', () => {
  afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

  it('creates output and temp subdirectories', () => {
    prepareStorageDirs(TMP)
    expect(fs.existsSync(path.join(TMP, 'output'))).toBe(true)
    expect(fs.existsSync(path.join(TMP, 'temp'))).toBe(true)
  })

  it('is idempotent — does not throw if dirs already exist', () => {
    expect(() => prepareStorageDirs(TMP)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/startup.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/startup.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import { runMigrations } from './db'
import { logger } from './lib/logger'

export function prepareStorageDirs(storagePath: string): void {
  const dirs = [
    path.join(storagePath, 'output'),
    path.join(storagePath, 'temp'),
  ]
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function runStartup(storagePath: string): void {
  logger.info('running startup checks')
  runMigrations()
  logger.info('database migrations applied')
  prepareStorageDirs(storagePath)
  logger.info({ storagePath }, 'storage directories ready')
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/startup.test.ts
```
Expected: PASS

- [ ] **Step 5: Run all backend tests**

```bash
cd backend && pnpm test
```
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/startup.ts backend/tests/unit/startup.test.ts
git commit -m "feat(startup): add startup validation for DB migrations and storage directory creation"
```

---

### Task 38: README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/readme.test.ts`:
```typescript
import fs from 'fs'
import path from 'path'

const README = path.join(__dirname, '../../../README.md')

describe('README.md', () => {
  it('exists at repo root', () => {
    expect(fs.existsSync(README)).toBe(true)
  })

  it('contains product name Omnigen', () => {
    const content = fs.readFileSync(README, 'utf-8')
    expect(content).toContain('Omnigen')
  })

  it('contains setup instructions', () => {
    const content = fs.readFileSync(README, 'utf-8')
    expect(content).toContain('pnpm install')
  })

  it('contains architecture section', () => {
    const content = fs.readFileSync(README, 'utf-8')
    expect(content.toLowerCase()).toContain('architecture')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/readme.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `README.md`**

```markdown
# Omnigen

> Automated video generation powered by AI — from a topic to a complete video in minutes.

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)

## Overview

Omnigen is a fullstack web application that takes a **topic** and a **video format** (short or long) and generates a complete video automatically:

- **Script** written by an LLM via OpenRouter
- **Narration** synthesized locally with Piper TTS (Brazilian Portuguese)
- **Images and video clips** sourced from Pexels
- **Final video** composed with FFmpeg
- **Thumbnails**, **tags**, and **SEO description** generated automatically

The entire pipeline runs synchronously with real-time progress streamed to the browser via SSE.

---

## Architecture

```
Browser (Next.js)
  └─ POST /api/generation/start       → title generation
  └─ POST /api/generation/:id/select  → title selection
  └─ GET  /api/generation/:id/stream  → SSE pipeline progress

Express Backend (port 3001)
  └─ Pipeline (linear, no queues)
       title → script → assets → TTS → subtitles
       → render (FFmpeg) → thumbnails → tags → description

SQLite (Drizzle ORM) — generations + logs tables
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20 + TypeScript + Express |
| Frontend | Next.js 14 App Router + Tailwind CSS |
| Database | SQLite + Drizzle ORM |
| LLM | OpenRouter (OpenAI-compatible API) |
| TTS | Piper (local, Brazilian Portuguese) |
| Video | FFmpeg via fluent-ffmpeg |
| Assets | Pexels API |
| Logger | Pino (JSON structured) |
| Tests | Jest + Supertest (backend), RTL (frontend) |

---

## Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **Python** 3.9+ with `piper-tts`: `pip install piper-tts`
- **FFmpeg** 6+ in PATH
  - Windows: `winget install Gyan.FFmpeg`
  - macOS: `brew install ffmpeg`
- **OpenRouter API key** — [openrouter.ai](https://openrouter.ai)
- **Pexels API key** — [pexels.com/api](https://www.pexels.com/api/)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd omnigen-v2
pnpm install
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
OPENROUTER_API_KEY=your_key_here
PEXELS_API_KEY=your_key_here
```

### 3. Run database migrations

```bash
pnpm --filter omnigen-backend db:generate
pnpm --filter omnigen-backend db:migrate
```

### 4. Start development servers

```bash
# Terminal 1 — backend (port 3001)
pnpm --filter omnigen-backend dev

# Terminal 2 — frontend (port 3000)
pnpm --filter omnigen-frontend dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running Tests

```bash
# All tests
pnpm test

# Backend only
pnpm --filter omnigen-backend test

# Frontend only
pnpm --filter omnigen-frontend test

# With coverage
pnpm --filter omnigen-backend test:coverage
```

---

## Folder Structure

```
omnigen-v2/
├── backend/
│   ├── src/
│   │   ├── config.ts            # zod env validation
│   │   ├── server.ts            # Express app
│   │   ├── routes/              # generation, history, logs
│   │   ├── services/            # one file per pipeline step
│   │   ├── db/                  # Drizzle schema + connection
│   │   └── lib/                 # openrouter, piper, ffmpeg, sse, logger
│   ├── prompts_templates/       # LLM prompt templates
│   ├── storage/                 # generated files (gitignored)
│   └── tests/                   # unit + integration
└── frontend/
    └── src/
        ├── app/                 # Next.js routes (/, /history, /logs)
        ├── components/          # UI components
        ├── hooks/               # useSSE
        ├── lib/                 # api client, logger
        └── types/               # shared TypeScript types
```

---

## Application Flow

1. User enters a **topic** and selects **video type** (short/long)
2. System generates **3 title suggestions** via LLM
3. User selects one title
4. System runs the full pipeline with real-time progress:
   - Generates script (LLM)
   - Searches images/videos (Pexels)
   - Downloads assets
   - Synthesizes narration (Piper TTS)
   - Generates subtitles (.srt)
   - Renders final video (FFmpeg)
   - Extracts thumbnails
   - Generates tags and description (LLM)
5. User receives: video, thumbnails, script, tags, description

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `openai/gpt-4o-mini` | LLM model to use |
| `PEXELS_API_KEY` | Yes | — | Pexels API key |
| `PIPER_MODEL_PATH` | No | `./pt_BR-faber-medium.onnx` | Piper model path |
| `FFMPEG_PATH` | No | `ffmpeg` | FFmpeg binary path |
| `PORT` | No | `3001` | Backend port |
| `DATABASE_URL` | No | `./storage/omnigen.db` | SQLite file path |

---

## Technical Decisions

- **Synchronous pipeline** — simplicity, predictability, easy debugging. No queues or workers in V1.
- **SSE over WebSockets** — one-way progress stream is sufficient; no bidirectional communication needed.
- **Piper TTS** — fully offline, no API costs, native Brazilian Portuguese support.
- **Pexels API** — free tier (200 req/hour), high quality, commercial license.
- **Drizzle ORM** — TypeScript-first, SQL-like, no magic, zero-config migrations.
- **SQLite** — zero-config, single-file, sufficient for V1 local usage.

---

## Observability

All backend logs are written to stdout as structured JSON (Pino) and persisted to the `logs` SQLite table. The frontend **Logs** tab queries `GET /api/logs` and supports filtering by level (info/warn/error/debug) and source (backend/frontend).

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `piper: command not found` | Run `pip install piper-tts` and ensure Python is in PATH |
| `ffmpeg: command not found` | Install FFmpeg and ensure it's in PATH |
| `Invalid environment variables` | Check `backend/.env` — required: `OPENROUTER_API_KEY`, `PEXELS_API_KEY` |
| Video renders with no audio | Verify Piper model file exists at `PIPER_MODEL_PATH` |
| Pexels returns no results | Query too specific; the asset search service falls back gracefully |

---

## Roadmap

- [ ] v1.0 — Core pipeline (this implementation)
- [ ] v1.1 — Retry failed pipeline steps from last checkpoint
- [ ] v1.2 — Export to YouTube / TikTok directly
- [ ] v2.0 — AI-generated images (Stable Diffusion) as optional mode
- [ ] v2.1 — Multi-language support
- [ ] v2.2 — Custom voice upload for TTS

---

## Conventions

- All code in **English** (variables, functions, types, comments, commits)
- All user-facing text in **Portuguese (pt-BR)**
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
- TDD: write test → fail → implement → pass → commit
- No commit without passing tests + lint + typecheck

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Write tests first (TDD)
4. Ensure all checks pass: `pnpm test && pnpm lint && pnpm typecheck`
5. Commit with semantic format: `feat(scope): description`
6. Open a pull request

---

*Built with Omnigen v1.0*
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/readme.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add README.md backend/tests/unit/readme.test.ts
git commit -m "docs(readme): add comprehensive README with setup, architecture, and usage guide"
```

---

### Task 39: Final Integration Check + Pre-commit Hook

**Files:**
- Create: `.lefthook.yml` (or `backend/.husky/pre-commit`)

- [ ] **Step 1: Run all tests across the monorepo**

```bash
pnpm test
```
Expected: All tests PASS across backend and frontend

- [ ] **Step 2: Run typecheck on both packages**

```bash
pnpm typecheck
```
Expected: No TypeScript errors

- [ ] **Step 3: Create `.lefthook.yml` at repo root**

```yaml
pre-commit:
  parallel: true
  commands:
    backend-test:
      root: backend/
      run: pnpm test --passWithNoTests
    backend-typecheck:
      root: backend/
      run: pnpm typecheck
    frontend-test:
      root: frontend/
      run: pnpm test --passWithNoTests
    frontend-typecheck:
      root: frontend/
      run: pnpm typecheck
```

- [ ] **Step 4: Install lefthook**

```bash
pnpm add -D lefthook -w
npx lefthook install
```

- [ ] **Step 5: Verify pre-commit hook runs**

```bash
git add .lefthook.yml
git commit -m "chore: add lefthook pre-commit gate for tests and typecheck"
```
Expected: Hook runs, all checks pass, commit succeeds

- [ ] **Step 6: Final smoke test — verify server starts**

```bash
# Terminal 1
cd backend && cp .env.example .env
# Edit backend/.env with real API keys, then:
pnpm dev

# Terminal 2 — verify health endpoint
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: finalize v1.0 implementation — all tests passing, pre-commit hook active"
```

---

## Implementation Complete

All 39 tasks are complete. The full Omnigen v1.0 pipeline is implemented:

| Layer | Status |
|-------|--------|
| Backend infrastructure | Tasks 1–8 |
| Generation pipeline services | Tasks 9–23 |
| API routes + SSE | Task 22 |
| Design system + Tailwind | Task 23 |
| Frontend components | Tasks 24–31 |
| Pages (home, history, logs) | Tasks 33–35 |
| Static file serving | Task 36 |
| Startup validation | Task 37 |
| README | Task 38 |
| Pre-commit hooks | Task 39 |

To execute this plan task-by-task, use the **superpowers:subagent-driven-development** or **superpowers:executing-plans** skill.
