process.env.OPENROUTER_API_KEY = 'test'
process.env.SERPAPI_KEY = 'test-serpapi-key'

jest.mock('../../src/lib/openrouter')

import { generateDescription } from '../../src/services/description.service'
import * as openrouter from '../../src/lib/openrouter'

const mockCallLLM = openrouter.callLLM as jest.MockedFunction<typeof openrouter.callLLM>

describe('generateDescription', () => {
  it('returns the LLM response as description string', async () => {
    mockCallLLM.mockResolvedValueOnce('Descubra os segredos de Zeus, o poderoso rei dos deuses do Olimpo.')
    const result = await generateDescription('script content here')
    expect(result).toBe('Descubra os segredos de Zeus, o poderoso rei dos deuses do Olimpo.')
  })
})
