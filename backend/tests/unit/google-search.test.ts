process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
process.env.NODE_ENV = 'test'

import nock from 'nock'
import { googleImageSearch, googleVideoSearch } from '../../src/lib/google-search'

const BASE = 'https://www.googleapis.com'

describe('googleImageSearch', () => {
  afterEach(() => nock.cleanAll())

  it('returns image candidates from CSE response', async () => {
    nock(BASE)
      .get('/customsearch/v1')
      .query(true)
      .reply(200, {
        items: [
          { link: 'https://example.com/img1.jpg', image: { width: 1920, height: 1080 } },
          { link: 'https://example.com/img2.jpg', image: { width: 1280, height: 720 } },
        ],
      })

    const results = await googleImageSearch('Zeus thunder', 5)
    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://example.com/img1.jpg')
    expect(results[0].width).toBe(1920)
    expect(results[0].height).toBe(1080)
  })

  it('returns empty array when no items', async () => {
    nock(BASE).get('/customsearch/v1').query(true).reply(200, {})
    const results = await googleImageSearch('nothing found', 5)
    expect(results).toEqual([])
  })

  it('caps count at 10', async () => {
    let capturedQuery: Record<string, string> = {}
    nock(BASE)
      .get('/customsearch/v1')
      .query((q) => { capturedQuery = q as Record<string, string>; return true })
      .reply(200, { items: [] })

    await googleImageSearch('test', 20)
    expect(capturedQuery.num).toBe('10')
  })
})

describe('googleVideoSearch', () => {
  afterEach(() => nock.cleanAll())

  it('returns only direct mp4 links', async () => {
    nock(BASE)
      .get('/customsearch/v1')
      .query(true)
      .reply(200, {
        items: [
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
      .get('/customsearch/v1')
      .query(true)
      .reply(200, { items: [{ link: 'https://youtube.com/watch?v=x' }] })

    const results = await googleVideoSearch('test', 5)
    expect(results).toEqual([])
  })
})
