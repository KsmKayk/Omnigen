export type VideoType = 'short' | 'long'

export type GenerationStatus =
  | 'pending'
  | 'pending_title_selection'
  | 'processing'
  | 'completed'
  | 'failed'

export type PipelineStep =
  | 'titles'
  | 'script'
  | 'images'
  | 'assets'
  | 'videos'
  | 'tts'
  | 'subtitles'
  | 'render'
  | 'thumbnails'
  | 'tags'
  | 'description'
  | 'saving'
  | 'completed'

export interface ProgressEvent {
  step: PipelineStep
  status: 'processing' | 'done' | 'error'
  progress: number
  message?: string
  error?: string
}

export interface SceneBlock {
  sceneId: number
  description: string
  narration: string
}

export interface AssetRecord {
  sceneId: number
  type: 'image' | 'video'
  url: string
  localPath: string
  width: number
  height: number
}

export interface Generation {
  id: string
  theme: string
  videoType: VideoType
  suggestedTitles: string[] | null
  selectedTitle: string | null
  script: SceneBlock[] | null
  assets: AssetRecord[] | null
  ttsPath: string | null
  subtitlePath: string | null
  videoPath: string | null
  thumbnails: string[] | null
  tags: string[] | null
  description: string | null
  status: GenerationStatus
  error: string | null
  createdAt: number
  updatedAt: number
}

export interface GenerationResult {
  generationId: string
  title: string
  videoPath: string
  thumbnails: string[]
  script: SceneBlock[]
  tags: string[]
  description: string
}

export type EmitFn = (event: ProgressEvent) => void
