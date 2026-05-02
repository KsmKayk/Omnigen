import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { getAudioDurationMs, buildConcatFile } from '../lib/ffmpeg'
import { ensureDir } from './asset-download.service'
import type { AssetRecord, SceneBlock, VideoType } from '../types'

interface RenderOptions {
  generationId: string
  storagePath: string
  assets: AssetRecord[]
  scenes: SceneBlock[]
  ttsPath: string
  subtitlePath: string
  videoType: VideoType
}

const RESOLUTIONS: Record<VideoType, { width: number; height: number }> = {
  short: { width: 1080, height: 1920 },
  long: { width: 1920, height: 1080 },
}

export async function renderVideo(opts: RenderOptions): Promise<string> {
  const { generationId, storagePath, assets, scenes, ttsPath, subtitlePath, videoType } = opts

  const outputDir = path.join(storagePath, 'output', generationId)
  ensureDir(outputDir)
  const tempDir = path.join(storagePath, 'temp', generationId)
  ensureDir(tempDir)

  const audioMs = await getAudioDurationMs(ttsPath)
  const { width, height } = RESOLUTIONS[videoType]
  const durationPerScene = Math.floor(audioMs / scenes.length)

  const imagePaths = assets.map((a) => a.localPath)
  const concatContent = buildConcatFile(imagePaths, durationPerScene)
  const concatPath = path.join(tempDir, 'concat.txt')
  fs.writeFileSync(concatPath, concatContent, 'utf-8')

  const outputPath = path.join(outputDir, 'video.mp4')

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .input(ttsPath)
      .outputOptions([
        `-vf`, `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},subtitles='${subtitlePath.replace(/\\/g, '/')}'`,
        `-c:v`, `libx264`,
        `-c:a`, `aac`,
        `-shortest`,
        `-y`,
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run()
  })
}
