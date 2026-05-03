process.env.OPENROUTER_API_KEY = 'test'
process.env.SERPAPI_KEY = 'test-serpapi-key'

jest.mock('../../src/lib/piper')
jest.mock('../../src/lib/ffmpeg')

import path from 'path'
import * as piper from '../../src/lib/piper'
import * as ffmpeg from '../../src/lib/ffmpeg'
import { synthesizeSpeech } from '../../src/services/tts.service'
import type { SceneBlock } from '../../src/types'

const mockRunPiper = piper.runPiper as jest.MockedFunction<typeof piper.runPiper>
const mockGetDuration = ffmpeg.getAudioDurationMs as jest.MockedFunction<typeof ffmpeg.getAudioDurationMs>
const mockConcatenate = ffmpeg.concatenateAudioFiles as jest.MockedFunction<typeof ffmpeg.concatenateAudioFiles>

const SCENES: SceneBlock[] = [
  { sceneId: 1, description: 'Abertura', narration: 'Zeus governava o olimpo.' },
  { sceneId: 2, description: 'Conflito', narration: 'Os titÃ£s se rebelaram.' },
]

describe('synthesizeSpeech', () => {
  beforeEach(() => {
    mockRunPiper.mockResolvedValue('/tmp/out.wav')
    mockGetDuration.mockResolvedValueOnce(3000).mockResolvedValueOnce(4000)
    mockConcatenate.mockResolvedValue(undefined)
  })

  afterEach(() => jest.clearAllMocks())

  it('calls runPiper once per scene', async () => {
    await synthesizeSpeech(SCENES, 'gen1', '/tmp')
    expect(mockRunPiper).toHaveBeenCalledTimes(2)
    expect(mockRunPiper).toHaveBeenCalledWith(
      'Zeus governava o olimpo.',
      expect.stringContaining(path.join('gen1', 'scene_1.wav')),
    )
    expect(mockRunPiper).toHaveBeenCalledWith(
      'Os titÃ£s se rebelaram.',
      expect.stringContaining(path.join('gen1', 'scene_2.wav')),
    )
  })

  it('returns audioPath and exact per-scene durations', async () => {
    const result = await synthesizeSpeech(SCENES, 'gen1', '/tmp')
    expect(result.audioPath).toContain('narration.wav')
    expect(result.durations).toEqual([3000, 4000])
  })

  it('concatenates scene wavs into one narration file', async () => {
    await synthesizeSpeech(SCENES, 'gen1', '/tmp')
    expect(mockConcatenate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('scene_1.wav'),
        expect.stringContaining('scene_2.wav'),
      ]),
      expect.stringContaining('narration.wav'),
    )
  })

  it('throws if piper execution fails', async () => {
    mockRunPiper.mockRejectedValueOnce(new Error('Piper process failed'))
    await expect(synthesizeSpeech(SCENES, 'gen2', '/tmp')).rejects.toThrow('Piper process failed')
  })
})
