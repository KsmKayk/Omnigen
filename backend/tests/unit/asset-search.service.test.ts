process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
process.env.NODE_ENV = 'test'

import nock from 'nock'
import { searchImages, searchVideos } from '../../src/services/asset-search.service'

describe('searchImages', () => {
  afterEach(() => nock.cleanAll())

  it.skip('returns image URL and dimensions from Google Custom Search', async () => {
    // TODO: Implement Google Custom Search API for images
    nock('https://cse.google.com')
      .get('/cse/element/v1')
      .query(true)
      .reply(200, {
        items: [{
          link: 'https://example.com/image.jpg',
          image: { width: 1080, height: 1920 },
        }],
      })

    const result = await searchImages('Zeus thunder', 'portrait')
    expect(result).not.toBeNull()
    expect(result!.url).toContain('example.com')
    expect(result!.width).toBe(1080)
  })

  it('returns null when no photos found', async () => {
    const result = await searchImages('very obscure query', 'landscape')
    expect(result).toBeNull()
  })
})

describe('searchVideos', () => {
  afterEach(() => nock.cleanAll())

  it.skip('returns video URL from Google Custom Search', async () => {
    // TODO: Implement Google Custom Search API for videos
    nock('https://cse.google.com')
      .get('/cse/element/v1')
      .query(true)
      .reply(200, {
        items: [{
          link: 'https://example.com/video.mp4',
          image: { width: 1920, height: 1080 },
        }],
      })

    const result = await searchVideos('storm lightning')
    expect(result).not.toBeNull()
    expect(result!.url).toContain('example.com')
  })

  it('returns null when no videos found', async () => {
    const result = await searchVideos('obscure')
    expect(result).toBeNull()
  })
})
