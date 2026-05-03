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

  if (assets.length !== scenes.length) {
    throw new Error(`Asset count (${assets.length}) does not match scene count (${scenes.length})`)
  }

  const audioMs = await getAudioDurationMs(ttsPath)
  const { width, height } = RESOLUTIONS[videoType]
  const durationPerScene = Math.floor(audioMs / scenes.length)

  // Pre-trim video assets to exact scene duration using libx264 re-encode
  // (stream copy fails for VP9/AV1; inpoint/outpoint collapses all clips to ts=0)
  const processedAssets: AssetRecord[] = []
  for (const asset of assets) {
    if (asset.type === 'video') {
      const trimmedPath = path.join(tempDir, `scene_${asset.sceneId}_trim.mp4`)
      await new Promise<void>((resolve, reject) => {
        ffmpeg(asset.localPath)
          .outputOptions([
            '-t', String(durationPerScene / 1000),
            '-map', '0:v:0',
            '-map', '0:a:0?',
            '-c:v', 'libx264', '-preset', 'ultrafast',
            '-c:a', 'aac',
            '-y',
          ])
          .output(trimmedPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run()
      })
      processedAssets.push({ ...asset, localPath: trimmedPath })
    } else {
      processedAssets.push(asset)
    }
  }

  const concatContent = buildConcatFile(processedAssets, durationPerScene)
  const concatPath = path.join(tempDir, 'concat.txt')
  fs.writeFileSync(concatPath, concatContent, 'utf-8')

  const outputPath = path.join(outputDir, 'video.mp4')

  const subtitleStyle =
    'FontName=Arial,FontSize=22,Bold=1,' +
    'PrimaryColour=&H00ffffff,OutlineColour=&H00000000,' +
    'BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=50'
  const escapedSub = subtitlePath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, '$1\\:')

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .input(ttsPath)
      .outputOptions([
        `-vf`, `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},subtitles='${escapedSub}':force_style='${subtitleStyle}'`,
        `-c:v`, `libx264`,
        `-crf`, `18`,
        `-preset`, `fast`,
        `-c:a`, `aac`,
        `-b:a`, `192k`,
        `-movflags`, `+faststart`,
        `-map`, `0:v:0`,
        `-map`, `1:a:0`,
        `-shortest`,
        `-y`,
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run()
  })
}
