import { getAudioDurationMs, buildConcatFile } from '../../src/lib/ffmpeg'
import * as childProcess from 'child_process'

jest.mock('child_process')
process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const mockExecFile = childProcess.execFile as jest.MockedFunction<typeof childProcess.execFile>

describe('getAudioDurationMs', () => {
  it('parses ffprobe duration output', async () => {
    // ffprobe outputs duration to stderr
    mockExecFile.mockImplementation((_cmd, _args, callback: any) => {
      callback(null, '', 'Duration: 00:00:52.34, start: 0')
      return {} as any
    })

    const ms = await getAudioDurationMs('/tmp/narration.wav')
    expect(ms).toBe(52340)
  })
})

describe('buildConcatFile', () => {
  it('generates ffmpeg concat file content', () => {
    const content = buildConcatFile(['/tmp/scene1.jpg', '/tmp/scene2.jpg'], 5000)
    expect(content).toContain("file '/tmp/scene1.jpg'")
    expect(content).toContain('duration 5')
  })
})
