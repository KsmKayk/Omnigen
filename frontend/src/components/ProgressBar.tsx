import type { PipelineStep, StepState } from '../types'

const STEP_LABELS: Record<PipelineStep, string> = {
  titles: 'Gerando títulos',
  script: 'Gerando roteiro',
  images: 'Buscando imagens',
  videos: 'Buscando vídeos',
  assets: 'Baixando assets',
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
  'script', 'images', 'videos', 'assets', 'tts', 'subtitles',
  'render', 'thumbnails', 'tags', 'description', 'saving',
]

interface ProgressBarProps {
  progress: number
  steps: Partial<Record<PipelineStep, StepState>>
}

export function ProgressBar({ progress, steps }: ProgressBarProps) {
  return (
    <div className="w-full space-y-4">
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

      <ol className="space-y-2">
        {ORDERED_STEPS.map((step) => {
          const state = steps[step]
          if (!state) return null

          return (
            <li key={step} className="flex items-start gap-3">
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
