process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
process.env.NODE_ENV = 'test'

import { searchImages, searchVideos } from '../../src/services/asset-search.service'

describe('searchImages', () => {
  it('returns null', async () => {
    const result = await searchImages('Zeus thunder', 'portrait')
    expect(result).toBeNull()
  })
})

describe('searchVideos', () => {
  it('returns null', async () => {
    const result = await searchVideos('storm lightning')
    expect(result).toBeNull()
  })
})
