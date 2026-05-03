process.env.OPENROUTER_API_KEY = 'test'
process.env.SERPAPI_KEY = 'test-serpapi-key'
process.env.NODE_ENV = 'test'

import nock from 'nock'
import { googleImageSearch, googleVideoSearch } from '../../src/lib/google-search'

const BASE = 'https://serpapi.com'

describe('googleImageSearch', () => {
  afterEach(() => nock.cleanAll())

  it('returns image candidates from SerpAPI response', async () => {
    nock(BASE)
      .get('/search.json')
      .query(true)
      .reply(200, {
        images_results: [
          { original: 'https://example.com/img1.jpg', original_width: 1920, original_height: 1080 },
          { original: 'https://example.com/img2.jpg', original_width: 1280, original_height: 720 },
        ],
      })

    const results = await googleImageSearch('Zeus thunder', 5)
    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://example.com/img1.jpg')
    expect(results[0].width).toBe(1920)
    expect(results[0].height).toBe(1080)
  })

  it('returns empty array when no items', async () => {
    nock(BASE).get('/search.json').query(true).reply(200, {})
    const results = await googleImageSearch('nothing found', 5)
    expect(results).toEqual([])
  })

  it('caps count at 10', async () => {
    let capturedQuery: Record<string, string> = {}
    nock(BASE)
      .get('/search.json')
      .query((q) => { capturedQuery = q as Record<string, string>; return true })
      .reply(200, { images_results: [] })

    await googleImageSearch('test', 20)
    expect(capturedQuery.num).toBe('10')
  })

  it('throws on SerpAPI error response', async () => {
    nock(BASE).get('/search.json').query(true).reply(200, { error: 'Invalid API key.' })
    await expect(googleImageSearch('test', 5)).rejects.toThrow('SerpAPI error: Invalid API key.')
  })
})

describe('googleVideoSearch', () => {
  afterEach(() => nock.cleanAll())

  it('returns only direct mp4 links', async () => {
    nock(BASE)
      .get('/search.json')
      .query(true)
      .reply(200, {
        organic_results: [
          { link: 'https://cdn.example.com/video.mp4' },
          { link: 'https://www.youtube.com/watch?v=abc' },
          { link: 'https://cdn.example.com/clip.MP4?token=xyz' },
        ],
      })

    const results = await googleVideoSearch('storm', 5)
    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://cdn.example.com/video.mp4')
    expect(results[1].url).toBe('https://cdn.example.com/clip.MP4?token=xyz')
  })

  it('returns empty array when no mp4 links found', async () => {
    nock(BASE)
      .get('/search.json')
      .query(true)
      .reply(200, { organic_results: [{ link: 'https://youtube.com/watch?v=x' }] })

    const results = await googleVideoSearch('test', 5)
    expect(results).toEqual([])
  })
})
