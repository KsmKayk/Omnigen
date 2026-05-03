import path from 'path'
import { generateScript } from './script.service'
import { searchImages, searchVideos } from './asset-search.service'
import { downloadWithFallback, ensureDir } from './asset-download.service'
import { synthesizeSpeech } from './tts.service'
import { generateSubtitles } from './subtitle.service'
import { renderVideo } from './render.service'
import { generateThumbnails } from './thumbnail.service'
import { generateTags } from './tags.service'
import { generateDescription } from './description.service'
import type { AssetRecord, EmitFn, GenerationResult, PipelineStep, VideoType } from '../types'

interface PipelineInput {
  generationId: string
  theme: string
  videoType: VideoType
  selectedTitle: string
  storagePath: string
  emit: EmitFn
}

function progress(emit: EmitFn, step: PipelineStep, pct: number, msg: string) {
  emit({ step, status: 'processing', progress: pct, message: msg })
}

function done(emit: EmitFn, step: PipelineStep, pct: number) {
  emit({ step, status: 'done', progress: pct })
}

async function withEmit<T>(
  emit: EmitFn,
  step: PipelineStep,
  startPct: number,
  endPct: number,
  message: string,
  fn: () => Promise<T>,
): Promise<T> {
  progress(emit, step, startPct, message)
  try {
    const result = await fn()
    done(emit, step, endPct)
    return result
  } catch (err) {
    emit({ step, status: 'error', progress: startPct, error: (err as Error).message })
    throw err
  }
}

export async function runPipeline(input: PipelineInput): Promise<GenerationResult> {
  const { generationId, theme, videoType, selectedTitle, storagePath, emit } = input

  const orientation = videoType === 'short' ? 'portrait' : 'landscape'

  const scenes = await withEmit(emit, 'script', 10, 20, 'Gerando roteiro...', () =>
    generateScript(theme, videoType, selectedTitle),
  )

  const assetSearchResults = await withEmit(emit, 'images', 20, 30, 'Buscando imagens...', async () =>
    Promise.all(scenes.map((scene) => searchImages(scene.description, orientation))),
  )

  const videoSearchResults = await withEmit(emit, 'videos', 30, 38, 'Buscando vídeos...', async () =>
    Promise.all(scenes.map((scene) => searchVideos(scene.description))),
  )

  const assets: AssetRecord[] = await withEmit(emit, 'assets', 38, 42, 'Baixando assets...', async () => {
    const assetsDir = path.join(storagePath, 'temp', generationId, 'assets')
    ensureDir(assetsDir)
    const records: AssetRecord[] = []

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const videoCandidates = videoSearchResults[i]
      const imageCandidates = assetSearchResults[i]

      const videoDestPath = path.join(assetsDir, `scene_${scene.sceneId}.mp4`)
      const downloadedVideo = await downloadWithFallback(videoCandidates, videoDestPath)
      if (downloadedVideo) {
        records.push({
          sceneId: scene.sceneId,
          type: 'video',
          url: downloadedVideo.url,
          localPath: videoDestPath,
          width: downloadedVideo.width,
          height: downloadedVideo.height,
        })
        continue
      }

      const imageDestPath = path.join(assetsDir, `scene_${scene.sceneId}.jpg`)
      const downloadedImage = await downloadWithFallback(imageCandidates, imageDestPath)
      if (downloadedImage) {
        records.push({
          sceneId: scene.sceneId,
          type: 'image',
          url: downloadedImage.url,
          localPath: imageDestPath,
          width: downloadedImage.width,
          height: downloadedImage.height,
        })
      }
    }

    return records
  })

  const { audioPath: ttsPath, durations } = await withEmit(emit, 'tts', 42, 55, 'Gerando narração...', () =>
    synthesizeSpeech(scenes, generationId, storagePath),
  )

  const subtitlePath = await withEmit(emit, 'subtitles', 55, 60, 'Gerando legendas...', () =>
    generateSubtitles(scenes, durations, generationId, storagePath),
  )

  const videoPath = await withEmit(emit, 'render', 60, 80, 'Renderizando vídeo...', () =>
    renderVideo({ generationId, storagePath, assets, scenes, ttsPath, subtitlePath, videoType }),
  )

  const thumbnails = await withEmit(emit, 'thumbnails', 80, 88, 'Gerando thumbnails...', () =>
    generateThumbnails(generationId, storagePath, videoPath),
  )

  const scriptText = scenes.map((s) => s.narration).join(' ')
  const tags = await withEmit(emit, 'tags', 88, 93, 'Gerando tags...', () =>
    generateTags(scriptText),
  )

  const description = await withEmit(emit, 'description', 93, 97, 'Gerando descrição...', () =>
    generateDescription(scriptText),
  )

  const outputBase = path.join(storagePath, 'output')
  const toPublicUrl = (localPath: string) =>
    '/output/' + path.relative(outputBase, localPath).replace(/\\/g, '/')

  emit({
    step: 'completed',
    status: 'done',
    progress: 100,
    message: 'Vídeo gerado com sucesso!',
    result: {
      videoPath: toPublicUrl(videoPath),
      thumbnails: thumbnails.map(toPublicUrl),
      tags,
      description,
    },
  })

  return {
    generationId,
    title: selectedTitle,
    videoPath,
    thumbnails,
    script: scenes,
    tags,
    description,
  }
}
