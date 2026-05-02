import path from 'path'
import { getAudioDurationMs, extractFrame } from '../lib/ffmpeg'
import { ensureDir } from './asset-download.service'

const THUMBNAIL_POSITIONS = [0.1, 0.5, 0.9]

export async function generateThumbnails(
  generationId: string,
  storagePath: string,
  videoPath: string,
): Promise<string[]> {
  const outputDir = path.join(storagePath, 'output', generationId)
  ensureDir(outputDir)

  const durationMs = await getAudioDurationMs(videoPath)
  const durationSecs = durationMs / 1000

  const thumbnails: string[] = []

  for (let i = 0; i < THUMBNAIL_POSITIONS.length; i++) {
    const seekSecs = Math.floor(durationSecs * THUMBNAIL_POSITIONS[i])
    const outputPath = path.join(outputDir, `thumb${i + 1}.jpg`)
    await extractFrame(videoPath, outputPath, seekSecs)
    thumbnails.push(outputPath)
  }

  return thumbnails
}
