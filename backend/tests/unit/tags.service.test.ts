process.env.OPENROUTER_API_KEY = 'test'
process.env.SERPAPI_KEY = 'test-serpapi-key'

jest.mock('../../src/lib/openrouter')

import { generateTags } from '../../src/services/tags.service'
import * as openrouter from '../../src/lib/openrouter'

const mockCallLLM = openrouter.callLLM as jest.MockedFunction<typeof openrouter.callLLM>

describe('generateTags', () => {
  it('parses comma-separated tags', async () => {
    mockCallLLM.mockResolvedValueOnce('Zeus, mitologia, deuses gregos, Olimpo, trovÃµes, poder, histÃ³ria, lenda, GrÃ©cia, titÃ£s')
    const tags = await generateTags('Zeus governava o mundo.')
    expect(tags).toHaveLength(10)
    expect(tags[0]).toBe('Zeus')
    expect(tags[9]).toBe('titÃ£s')
  })

  it('trims whitespace from each tag', async () => {
    mockCallLLM.mockResolvedValueOnce(' tag1 , tag2 , tag3 , tag4 , tag5 , tag6 , tag7 , tag8 , tag9 , tag10 ')
    const tags = await generateTags('script text')
    expect(tags[0]).toBe('tag1')
    expect(tags[9]).toBe('tag10')
  })
})
