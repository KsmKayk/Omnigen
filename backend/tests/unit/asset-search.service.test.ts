process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
process.env.NODE_ENV = 'test'

jest.mock('../../src/lib/google-search')

import * as googleSearch from '../../src/lib/google-search'
import { searchImages, searchVideos } from '../../src/services/asset-search.service'

const mockImageSearch = googleSearch.googleImageSearch as jest.MockedFunction<typeof googleSearch.googleImageSearch>
const mockVideoSearch = googleSearch.googleVideoSearch as jest.MockedFunction<typeof googleSearch.googleVideoSearch>

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
  })

  it('appends orientation to query', async () => {
    mockImageSearch.mockResolvedValueOnce([])
    await searchImages('forest fire', 'landscape')
    expect(mockImageSearch).toHaveBeenCalledWith('forest fire landscape', 5)
  })

  it('returns empty array when CSE returns nothing', async () => {
    mockImageSearch.mockResolvedValueOnce([])
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
  })

  it('returns empty array when no videos found', async () => {
    mockVideoSearch.mockResolvedValueOnce([])
    const results = await searchVideos('obscure')
    expect(results).toEqual([])
  })
})
