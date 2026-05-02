'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (state.phase !== 'generating') return
    if (!sse.result || sse.isStreaming) return
    setState({
      phase: 'completed',
      generationId: state.generationId,
      selectedTitle: state.selectedTitle,
      videoPath: sse.result.videoPath,
      thumbnails: sse.result.thumbnails,
      tags: sse.result.tags,
      description: sse.result.description,
    })
  }, [sse.result, sse.isStreaming, state])

  const isFormDisabled = state.phase === 'loading_titles' || state.phase === 'generating'

  return (
    <div className="space-y-10">
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

      <div className="max-w-lg mx-auto">
        <GenerationForm onSubmit={handleFormSubmit} disabled={isFormDisabled} />
      </div>

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
