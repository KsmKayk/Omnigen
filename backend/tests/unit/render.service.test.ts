process.env.OPENROUTER_API_KEY = 'test'
process.env.SERPAPI_KEY = 'test-serpapi-key'

jest.mock('../../src/lib/ffmpeg')
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg: any = jest.fn(() => ({
    input: jest.fn().mockReturnThis(),
    inputOptions: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (this: any, event: string, cb: any) {
      if (event === 'end') setTimeout(cb, 0)
      return this
    }),
    run: jest.fn(),
  }))
  return mockFfmpeg
})

import path from 'path'
import * as ffmpegLib from '../../src/lib/ffmpeg'
import { renderVideo } from '../../src/services/render.service'
import type { AssetRecord, SceneBlock } from '../../src/types'

const mockGetAudioDurationMs = ffmpegLib.getAudioDurationMs as jest.MockedFunction<
  typeof ffmpegLib.getAudioDurationMs
>
const mockBuildConcatFile = ffmpegLib.buildConcatFile as jest.MockedFunction<
  typeof ffmpegLib.buildConcatFile
>

const MOCK_ASSETS: AssetRecord[] = [
  { sceneId: 1, type: 'image', url: 'https://example.com/1.jpg', localPath: '/tmp/scene_1.jpg', width: 1080, height: 1920 },
  { sceneId: 2, type: 'image', url: 'https://example.com/2.jpg', localPath: '/tmp/scene_2.jpg', width: 1080, height: 1920 },
]

const MOCK_SCENES: SceneBlock[] = [
  { sceneId: 1, description: 'Abertura', narration: 'Texto da cena um.' },
  { sceneId: 2, description: 'Cena dois', narration: 'Texto da cena dois.' },
]

describe('renderVideo', () => {
  it('calls getAudioDurationMs and returns output path', async () => {
    mockGetAudioDurationMs.mockResolvedValueOnce(50000)
    mockBuildConcatFile.mockReturnValueOnce("file '/tmp/scene_1.jpg'\nduration 25")

    const result = await renderVideo({
      generationId: 'gen1',
      storagePath: '/tmp',
      assets: MOCK_ASSETS,
      scenes: MOCK_SCENES,
      ttsPath: '/tmp/narration.wav',
      subtitlePath: '/tmp/subtitles.srt',
      videoType: 'short',
    })

    expect(mockGetAudioDurationMs).toHaveBeenCalledWith('/tmp/narration.wav')
    expect(mockBuildConcatFile).toHaveBeenCalledWith(
      ['/tmp/scene_1.jpg', '/tmp/scene_2.jpg'],
      25000, // floor(50000 / 2)
    )
    expect(result).toContain('video.mp4')
  })

  it('throws when assets and scenes have different lengths', async () => {
    await expect(
      renderVideo({
        generationId: 'gen2',
        storagePath: '/tmp',
        assets: MOCK_ASSETS.slice(0, 1), // 1 asset
        scenes: MOCK_SCENES, // 2 scenes
        ttsPath: '/tmp/narration.wav',
        subtitlePath: '/tmp/subtitles.srt',
        videoType: 'short',
      })
    ).rejects.toThrow('does not match')
  })
})
