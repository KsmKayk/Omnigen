import path from 'path'
import { runPiper } from '../lib/piper'
import { getAudioDurationMs, concatenateAudioFiles } from '../lib/ffmpeg'
import { ensureDir } from './asset-download.service'
import type { SceneBlock } from '../types'

export interface SpeechResult {
  audioPath: string
  durations: number[]
}

export async function synthesizeSpeech(
  scenes: SceneBlock[],
  generationId: string,
  storagePath: string,
): Promise<SpeechResult> {
  const dir = path.join(storagePath, 'temp', generationId)
  ensureDir(dir)

  const wavPaths: string[] = []
  const durations: number[] = []

  for (const scene of scenes) {
    const wavPath = path.join(dir, `scene_${scene.sceneId}.wav`)
    await runPiper(scene.narration, wavPath)
    const durationMs = await getAudioDurationMs(wavPath)
    wavPaths.push(wavPath)
    durations.push(durationMs)
  }

  const audioPath = path.join(dir, 'narration.wav')
  await concatenateAudioFiles(wavPaths, audioPath)

  return { audioPath, durations }
}
