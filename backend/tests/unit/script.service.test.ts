process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'
process.env.NODE_ENV = 'test'

jest.mock('../../src/lib/openrouter')

import { generateScript } from '../../src/services/script.service'
import * as openrouter from '../../src/lib/openrouter'

const mockCallLLM = openrouter.callLLM as jest.MockedFunction<typeof openrouter.callLLM>

const SAMPLE_SCRIPT = `[CENA 1] Zeus no Monte Olimpo
Na origem dos tempos, Zeus governava o mundo com pulso firme.

[CENA 2] A tempestade
Seus trovões ecoavam por toda a Terra, proclamando seu domínio.

[CENA 3] Os mortais
Os humanos tremiam e ofereciam sacrifícios ao rei dos deuses.`

describe('generateScript', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('parses scene blocks from LLM output', async () => {
    mockCallLLM.mockResolvedValueOnce(SAMPLE_SCRIPT)
    const scenes = await generateScript('Zeus', 'short', 'Zeus: O Senhor dos Trovões')
    expect(scenes).toHaveLength(3)
    expect(scenes[0].sceneId).toBe(1)
    expect(scenes[0].description).toBe('Zeus no Monte Olimpo')
    expect(scenes[0].narration).toBe(
      'Na origem dos tempos, Zeus governava o mundo com pulso firme.'
    )
  })

  it('uses short_template.txt for short videos (prompt contains 45)', async () => {
    mockCallLLM.mockResolvedValueOnce(SAMPLE_SCRIPT)
    await generateScript('Zeus', 'short', 'Título')
    const prompt = mockCallLLM.mock.calls[0][0]
    expect(prompt).toContain('45')
  })

  it('uses long_template.txt for long videos (prompt contains 10)', async () => {
    mockCallLLM.mockResolvedValueOnce(SAMPLE_SCRIPT)
    await generateScript('Zeus', 'long', 'Título')
    const prompt = mockCallLLM.mock.calls[0][0]
    expect(prompt).toContain('10')
  })

  it('throws if no scenes could be parsed', async () => {
    mockCallLLM.mockResolvedValueOnce('invalid output without scene markers')
    await expect(generateScript('teste', 'short', 'T')).rejects.toThrow('No scenes parsed')
  })

  it('includes title and theme in the prompt', async () => {
    mockCallLLM.mockResolvedValueOnce(SAMPLE_SCRIPT)
    await generateScript('Cleopatra', 'short', 'A Rainha do Nilo')
    const prompt = mockCallLLM.mock.calls[0][0]
    expect(prompt).toContain('Cleopatra')
    expect(prompt).toContain('A Rainha do Nilo')
  })
})
