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

  it('uses LLM to build query and returns HD-filtered results', async () => {
    mockCallLLM.mockResolvedValueOnce('Zeus thunder')
    mockImageSearch.mockResolvedValueOnce([
      { url: 'https://example.com/1.jpg', width: 1920, height: 1080 },
      { url: 'https://example.com/2.jpg', width: 1280, height: 720 },
    ])

    const results = await searchImages('Zeus lança raios sobre o Olimpo', 'portrait')
    expect(mockCallLLM).toHaveBeenCalledTimes(1)
    expect(mockImageSearch).toHaveBeenCalledWith('Zeus thunder vertical HD', 5)
    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://example.com/1.jpg')
  })

  it('filters out images below 720p and retries without qualifier', async () => {
    mockCallLLM.mockResolvedValueOnce('Zeus thunder')
    mockImageSearch
      .mockResolvedValueOnce([{ url: 'https://example.com/low.jpg', width: 640, height: 480 }])
      .mockResolvedValueOnce([{ url: 'https://example.com/hd.jpg', width: 1920, height: 1080 }])

    const results = await searchImages('Zeus lança raios', 'portrait')
    expect(mockImageSearch).toHaveBeenCalledTimes(2)
    expect(mockImageSearch).toHaveBeenLastCalledWith('Zeus thunder', 5)
    expect(results).toHaveLength(1)
    expect(results[0].url).toBe('https://example.com/hd.jpg')
  })

  it('returns empty array when no HD results found after fallback', async () => {
    mockCallLLM.mockResolvedValueOnce('Zeus thunder')
    mockImageSearch.mockResolvedValue([{ url: 'https://example.com/low.jpg', width: 640, height: 480 }])

    const results = await searchImages('Zeus lança raios', 'portrait')
    expect(results).toEqual([])
  })

  it('appends vertical for portrait, horizontal for landscape', async () => {
    mockCallLLM.mockResolvedValueOnce('forest fire')
    mockImageSearch.mockResolvedValueOnce([{ url: 'https://example.com/1.jpg', width: 1920, height: 1080 }])

    await searchImages('forest fire scene', 'landscape')
    expect(mockImageSearch).toHaveBeenCalledWith('forest fire horizontal HD', 5)
  })
})

describe('searchVideos', () => {
  afterEach(() => jest.clearAllMocks())

  it('uses LLM to build query and appends cinematic qualifier', async () => {
    mockCallLLM.mockResolvedValueOnce('storm lightning')
    mockVideoSearch.mockResolvedValueOnce([
      { url: 'https://www.youtube.com/watch?v=abc', width: 1920, height: 1080 },
    ])

    const results = await searchVideos('storm and lightning scene')
    expect(mockCallLLM).toHaveBeenCalledTimes(1)
    expect(mockVideoSearch).toHaveBeenCalledWith('storm lightning cinematic 4K footage', 5)
    expect(results).toHaveLength(1)
  })

  it('retries without quality qualifier when first search returns nothing', async () => {
    mockCallLLM.mockResolvedValueOnce('storm clouds')
    mockVideoSearch
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ url: 'https://www.youtube.com/watch?v=xyz', width: 1920, height: 1080 }])

    const results = await searchVideos('storm clouds rolling in')
    expect(mockVideoSearch).toHaveBeenCalledTimes(2)
    expect(mockVideoSearch).toHaveBeenLastCalledWith('storm clouds', 5)
    expect(results).toHaveLength(1)
  })

  it('returns empty array when no videos found even after fallback', async () => {
    mockCallLLM.mockResolvedValueOnce('generic')
    mockVideoSearch.mockResolvedValue([])

    const results = await searchVideos('obscure scene description')
    expect(results).toEqual([])
  })
})
