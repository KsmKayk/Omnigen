import { startGeneration, selectTitle } from '../../src/lib/api'

global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('startGeneration', () => {
  it('posts theme and videoType, returns generationId and titles', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ generationId: 'abc', titles: ['T1', 'T2', 'T3'] }),
    } as Response)

    const result = await startGeneration('Zeus', 'short')
    expect(result.generationId).toBe('abc')
    expect(result.titles).toHaveLength(3)
    expect(mockFetch).toHaveBeenCalledWith('/api/generation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'Zeus', videoType: 'short' }),
    })
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'theme is required' }),
    } as Response)

    await expect(startGeneration('', 'short')).rejects.toThrow('theme is required')
  })
})

describe('selectTitle', () => {
  it('posts titleIndex to correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ generationId: 'abc', selectedTitle: 'T1' }),
    } as Response)

    const result = await selectTitle('abc', 1)
    expect(result.selectedTitle).toBe('T1')
    expect(mockFetch).toHaveBeenCalledWith('/api/generation/abc/select-title', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ titleIndex: 1 }),
    }))
  })
})
