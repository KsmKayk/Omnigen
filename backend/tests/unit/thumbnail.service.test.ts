import * as ffmpegLib from '../../src/lib/ffmpeg'
import { generateThumbnails } from '../../src/services/thumbnail.service'

jest.mock('../../src/lib/ffmpeg')
jest.mock('../../src/services/asset-download.service')
process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'

const mockGetAudioDurationMs = ffmpegLib.getAudioDurationMs as jest.MockedFunction<
  typeof ffmpegLib.getAudioDurationMs
>
const mockExtractFrame = ffmpegLib.extractFrame as jest.MockedFunction<
  typeof ffmpegLib.extractFrame
>

describe('generateThumbnails', () => {
  it('extracts 3 frames at 10%, 50%, 90% of duration', async () => {
    mockGetAudioDurationMs.mockResolvedValueOnce(60000) // 60s
    mockExtractFrame
      .mockResolvedValueOnce('/tmp/thumb1.jpg')
      .mockResolvedValueOnce('/tmp/thumb2.jpg')
      .mockResolvedValueOnce('/tmp/thumb3.jpg')

    const result = await generateThumbnails('gen1', '/tmp', '/tmp/video.mp4')

    expect(mockExtractFrame).toHaveBeenCalledTimes(3)
    expect(mockExtractFrame.mock.calls[0][2]).toBeCloseTo(6, 0)
    expect(mockExtractFrame.mock.calls[1][2]).toBeCloseTo(30, 0)
    expect(mockExtractFrame.mock.calls[2][2]).toBeCloseTo(54, 0)

    expect(result).toHaveLength(3)
  })
})
