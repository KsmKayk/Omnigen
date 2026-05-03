process.env.OPENROUTER_API_KEY = 'test'
process.env.SERPAPI_KEY = 'test-serpapi-key'
process.env.NODE_ENV = 'test'

jest.mock('../../src/lib/google-search')
jest.mock('../../src/lib/openrouter')

import * as googleSearch from '../../src/lib/google-search'
import * as openrouter from '../../src/lib/openrouter'
import { searchImages, searchVideos } from '../../src/services/asset-search.service'

const mockImageSearch = googleSearch.googleImageSearch as jest.MockedFunction<typeof googleSearch.googleImageSearch>
const mockVideoSearch = googleSearch.googleVideoSearch as jest.MockedFunction<typeof googleSearch.googleVideoSearch>
const mockCallLLM = openrouter.callLLM as jest.MockedFunction<typeof openrouter.callLLM>

describe('searchImages', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns candidate array from googleImageSearch', async () => {
    mockImageSearch.mockResolvedValueOnce([
      { url: 'https://example.com/1.jpg', width: 1920, height: 1080 },
      { url: 'https://example.com/2.jpg', width: 1280, height: 720 },
    ])

    const results = await searchImages('Zeus thunder', 'portrait')
    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://example.com/1.jpg')
    expect(mockImageSearch).toHaveBeenCalledWith('Zeus thunder portrait', 5)
    expect(mockCallLLM).not.toHaveBeenCalled()
  })

  it('appends orientation to query', async () => {
    mockImageSearch.mockResolvedValueOnce([{ url: 'https://example.com/1.jpg', width: 1920, height: 1080 }])
    await searchImages('forest fire', 'landscape')
    expect(mockImageSearch).toHaveBeenCalledWith('forest fire landscape', 5)
  })

  it('simplifies query via LLM and retries when first search returns empty', async () => {
    mockImageSearch.mockResolvedValueOnce([]) // first attempt: empty
    mockCallLLM.mockResolvedValueOnce('lightning storm')
    mockImageSearch.mockResolvedValueOnce([{ url: 'https://example.com/simplified.jpg', width: 1920, height: 1080 }])

    const results = await searchImages('Zeus lança raios sobre o Olimpo enquanto os titãs se rebelam', 'portrait')
    expect(mockCallLLM).toHaveBeenCalledTimes(1)
    expect(mockImageSearch).toHaveBeenCalledTimes(2)
    expect(mockImageSearch).toHaveBeenLastCalledWith('lightning storm portrait', 5)
    expect(results).toHaveLength(1)
    expect(results[0].url).toBe('https://example.com/simplified.jpg')
  })

  it('returns empty array when both original and simplified search return nothing', async () => {
    mockImageSearch.mockResolvedValue([])
    mockCallLLM.mockResolvedValueOnce('generic query')

    const results = await searchImages('nothing', 'portrait')
    expect(results).toEqual([])
  })
})

describe('searchVideos', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns candidate array from googleVideoSearch', async () => {
    mockVideoSearch.mockResolvedValueOnce([
      { url: 'https://cdn.example.com/storm.mp4', width: 1920, height: 1080 },
    ])

    const results = await searchVideos('storm lightning')
    expect(results).toHaveLength(1)
    expect(results[0].url).toContain('.mp4')
    expect(mockVideoSearch).toHaveBeenCalledWith('storm lightning', 5)
    expect(mockCallLLM).not.toHaveBeenCalled()
  })

  it('simplifies query via LLM and retries when no videos found', async () => {
    mockVideoSearch.mockResolvedValueOnce([])
    mockCallLLM.mockResolvedValueOnce('storm clouds')
    mockVideoSearch.mockResolvedValueOnce([{ url: 'https://cdn.example.com/storm.mp4', width: 1920, height: 1080 }])

    const results = await searchVideos('cena complexa com efeitos especiais')
    expect(mockCallLLM).toHaveBeenCalledTimes(1)
    expect(mockVideoSearch).toHaveBeenCalledTimes(2)
    expect(mockVideoSearch).toHaveBeenLastCalledWith('storm clouds', 5)
    expect(results).toHaveLength(1)
  })

  it('returns empty array when no videos found even after simplification', async () => {
    mockVideoSearch.mockResolvedValue([])
    mockCallLLM.mockResolvedValueOnce('generic')

    const results = await searchVideos('obscure')
    expect(results).toEqual([])
  })
})
