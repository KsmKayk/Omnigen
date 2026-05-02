process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test-pexels-key'
process.env.NODE_ENV = 'test'

import nock from 'nock'
import { searchImages, searchVideos } from '../../src/services/asset-search.service'

describe('searchImages', () => {
  afterEach(() => nock.cleanAll())

  it('returns image URL and dimensions from Pexels', async () => {
    nock('https://api.pexels.com')
      .get('/v1/search')
      .query(true)
      .reply(200, {
        photos: [{
          src: { original: 'https://images.pexels.com/photos/1/photo.jpg' },
          width: 1080,
          height: 1920,
        }],
      })

    const result = await searchImages('Zeus thunder', 'portrait')
    expect(result).not.toBeNull()
    expect(result!.url).toContain('pexels.com')
    expect(result!.width).toBe(1080)
  })

  it('returns null when no photos found', async () => {
    nock('https://api.pexels.com').get('/v1/search').query(true).reply(200, { photos: [] })
    const result = await searchImages('very obscure query', 'landscape')
    expect(result).toBeNull()
  })
})

describe('searchVideos', () => {
  afterEach(() => nock.cleanAll())

  it('returns video URL from Pexels', async () => {
    nock('https://api.pexels.com')
      .get('/videos/search')
      .query(true)
      .reply(200, {
        videos: [{
          video_files: [{ link: 'https://videos.pexels.com/video.mp4', width: 1920, height: 1080 }],
        }],
      })

    const result = await searchVideos('storm lightning')
    expect(result).not.toBeNull()
    expect(result!.url).toContain('pexels.com')
  })

  it('returns null when no videos found', async () => {
    nock('https://api.pexels.com').get('/videos/search').query(true).reply(200, { videos: [] })
    const result = await searchVideos('obscure')
    expect(result).toBeNull()
  })
})
