import { getAudioDurationMs, buildConcatFile } from '../../src/lib/ffmpeg'
import * as childProcess from 'child_process'

jest.mock('child_process')
process.env.OPENROUTER_API_KEY = 'test'
process.env.SERPAPI_KEY = 'test-serpapi-key'

const mockExecFile = childProcess.execFile as jest.MockedFunction<typeof childProcess.execFile>

describe('getAudioDurationMs', () => {
  it('parses ffprobe duration output', async () => {
    // ffprobe outputs duration to stderr
    mockExecFile.mockImplementation((_cmd, _args, callback) => {
      (callback as (err: Error | null, stdout: string, stderr: string) => void)(null, '52.34', '')
      return {} as ReturnType<typeof childProcess.execFile>
    })

    const ms = await getAudioDurationMs('/tmp/narration.wav')
    expect(ms).toBe(52340)
  })
})

describe('buildConcatFile', () => {
  it('uses duration for images', () => {
    const content = buildConcatFile(
      [{ localPath: '/tmp/scene1.jpg', type: 'image' }, { localPath: '/tmp/scene2.jpg', type: 'image' }],
      5000,
    )
    expect(content).toContain("file '/tmp/scene1.jpg'")
    expect(content).toContain('duration 5')
    expect(content).not.toContain('inpoint')
  })

  it('uses only file entry for pre-trimmed videos (no duration/inpoint/outpoint)', () => {
    const content = buildConcatFile(
      [{ localPath: '/tmp/scene1.mp4', type: 'video' }],
      3500,
    )
    expect(content).toContain("file '/tmp/scene1.mp4'")
    expect(content).not.toContain('inpoint')
    expect(content).not.toContain('outpoint')
    expect(content).not.toContain('duration')
  })

  it('handles mixed image and video assets', () => {
    const content = buildConcatFile(
      [{ localPath: '/tmp/scene1.mp4', type: 'video' }, { localPath: '/tmp/scene2.jpg', type: 'image' }],
      4000,
    )
    expect(content).not.toContain('inpoint')
    expect(content).not.toContain('outpoint')
    expect(content).toContain('duration 4')
  })
})
