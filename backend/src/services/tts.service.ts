import path from 'path'
import { runPiper } from '../lib/piper'
import { ensureDir } from './asset-download.service'
import type { SceneBlock } from '../types'

export function buildNarrationText(scenes: SceneBlock[]): string {
  return scenes.map((s) => s.narration).join(' ')
}

export async function synthesizeSpeech(
  narrationText: string,
  generationId: string,
  storagePath: string,
): Promise<string> {
  const dir = path.join(storagePath, 'temp', generationId)
  ensureDir(dir)

  const outputPath = path.join(dir, 'narration.wav')
  await runPiper(narrationText, outputPath)

  return outputPath
}
