process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

jest.mock('../../src/lib/piper')

import path from 'path'
import * as piper from '../../src/lib/piper'
import { synthesizeSpeech } from '../../src/services/tts.service'

const mockRunPiper = piper.runPiper as jest.MockedFunction<typeof piper.runPiper>

describe('synthesizeSpeech', () => {
  it('calls runPiper with correct arguments', async () => {
    mockRunPiper.mockResolvedValueOnce('/tmp/gen1/narration.wav')
    const narrationText = 'Zeus governava o mundo com trovões.'
    const result = await synthesizeSpeech(narrationText, 'gen1', '/tmp')
    expect(mockRunPiper).toHaveBeenCalledWith(
      narrationText,
      expect.stringContaining(path.join('gen1', 'narration.wav')),
    )
    expect(result).toContain('narration.wav')
  })

  it('throws if piper execution fails', async () => {
    mockRunPiper.mockRejectedValueOnce(new Error('Piper process failed'))
    await expect(synthesizeSpeech('test', 'gen2', '/tmp')).rejects.toThrow('Piper process failed')
  })
})
