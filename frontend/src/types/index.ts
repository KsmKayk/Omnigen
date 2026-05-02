export type VideoType = 'short' | 'long'

export type GenerationStatus =
  | 'pending'
  | 'pending_title_selection'
  | 'processing'
  | 'completed'
  | 'failed'

export type PipelineStep =
  | 'titles' | 'script' | 'images' | 'videos' | 'assets'
  | 'tts' | 'subtitles' | 'render' | 'thumbnails'
  | 'tags' | 'description' | 'saving' | 'completed'

export interface ProgressEventResult {
  videoPath: string
  thumbnails: string[]
  tags: string[]
  description: string
}

export interface ProgressEvent {
  step: PipelineStep
  status: 'processing' | 'done' | 'error'
  progress: number
  message?: string
  error?: string
  result?: ProgressEventResult
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
