process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'
process.env.NODE_ENV = 'test'

jest.mock('../../src/lib/openrouter')

import { generateTitles } from '../../src/services/title.service'
import * as openrouter from '../../src/lib/openrouter'

const mockCallLLM = openrouter.callLLM as jest.MockedFunction<typeof openrouter.callLLM>

describe('generateTitles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('returns exactly 3 titles from LLM response', async () => {
    mockCallLLM.mockResolvedValueOnce(
      'A Queda dos Deuses\nZeus: O Senhor dos Trovões\nO Mito da Criação'
    )
    const titles = await generateTitles('Zeus', 'short')
    expect(titles).toHaveLength(3)
    expect(titles[0]).toBe('A Queda dos Deuses')
    expect(titles[2]).toBe('O Mito da Criação')
  })

  it('trims whitespace from each title', async () => {
    mockCallLLM.mockResolvedValueOnce('  Título Um  \n  Título Dois  \n  Título Três  ')
    const titles = await generateTitles('teste', 'long')
    expect(titles[0]).toBe('Título Um')
    expect(titles[1]).toBe('Título Dois')
  })

  it('throws if LLM returns fewer than 3 non-empty lines', async () => {
    mockCallLLM.mockResolvedValueOnce('Apenas um título')
    await expect(generateTitles('teste', 'short')).rejects.toThrow('Expected 3 titles')
  })

  it('passes theme and videoType to LLM prompt', async () => {
    mockCallLLM.mockResolvedValueOnce('T1\nT2\nT3')
    await generateTitles('Cleopatra', 'long')
    const prompt = mockCallLLM.mock.calls[0][0]
    expect(prompt).toContain('Cleopatra')
    expect(prompt).toContain('long')
  })
})
