import fs from 'fs'
import path from 'path'
import { ensureDir } from './asset-download.service'
import type { SceneBlock } from '../types'

export function formatSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1_000)
  const millis = ms % 1_000

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':') + `,${String(millis).padStart(3, '0')}`
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

function buildSRT(scenes: SceneBlock[], totalDurationMs: number): string {
  const totalWords = scenes.reduce((sum, s) => sum + countWords(s.narration), 0)
  const blocks: string[] = []

  let cursor = 0

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    const words = countWords(scene.narration)
    const duration = Math.round((words / totalWords) * totalDurationMs)
    const start = cursor
    const end = cursor + duration

    blocks.push(
      [
        String(i + 1),
        `${formatSRTTime(start)} --> ${formatSRTTime(end)}`,
        scene.narration,
        '',
      ].join('\n'),
    )

    cursor = end
  }

  return blocks.join('\n')
}

export async function generateSubtitles(
  scenes: SceneBlock[],
  generationId: string,
  storagePath: string,
  totalDurationMs: number,
): Promise<string> {
  const dir = path.join(storagePath, 'temp', generationId)
  ensureDir(dir)

  const srtContent = buildSRT(scenes, totalDurationMs)
  const srtPath = path.join(dir, 'subtitles.srt')
  fs.writeFileSync(srtPath, srtContent, 'utf-8')

  return srtPath
}
