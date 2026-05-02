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

function buildSRT(scenes: SceneBlock[], durations: number[]): string {
  const blocks: string[] = []
  let cursor = 0

  for (let i = 0; i < scenes.length; i++) {
    const start = cursor
    const end = cursor + durations[i]

    blocks.push(
      [
        String(i + 1),
        `${formatSRTTime(start)} --> ${formatSRTTime(end)}`,
        scenes[i].narration,
        '',
      ].join('\n'),
    )

    cursor = end
  }

  return blocks.join('\n')
}

export async function generateSubtitles(
  scenes: SceneBlock[],
  durations: number[],
  generationId: string,
  storagePath: string,
): Promise<string> {
  const dir = path.join(storagePath, 'temp', generationId)
  ensureDir(dir)

  const srtContent = buildSRT(scenes, durations)
  const srtPath = path.join(dir, 'subtitles.srt')
  fs.writeFileSync(srtPath, srtContent, 'utf-8')

  return srtPath
}
