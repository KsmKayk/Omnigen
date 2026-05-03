process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
process.env.NODE_ENV = 'test'

import fs from 'fs'
import path from 'path'
import nock from 'nock'
import { downloadAsset, ensureDir, downloadWithFallback } from '../../src/services/asset-download.service'
import type { AssetSearchResult } from '../../src/types'

const TMP = path.join(__dirname, 'tmp_download_test')

describe('downloadAsset', () => {
  beforeAll(() => fs.mkdirSync(TMP, { recursive: true }))
  afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))
  afterEach(() => nock.cleanAll())

  it('downloads file to destination path', async () => {
    nock('https://files.pexels.com')
      .get('/photo.jpg')
      .reply(200, Buffer.from('fake-image-data'), { 'content-type': 'image/jpeg' })

    const dest = path.join(TMP, 'photo.jpg')
    await downloadAsset('https://files.pexels.com/photo.jpg', dest)
    expect(fs.existsSync(dest)).toBe(true)
    expect(fs.readFileSync(dest).toString()).toBe('fake-image-data')
  })

  it('throws on HTTP error status', async () => {
    nock('https://files.pexels.com').get('/missing.jpg').reply(404)
    await expect(
      downloadAsset('https://files.pexels.com/missing.jpg', path.join(TMP, 'x.jpg'))
    ).rejects.toThrow('HTTP 404')
  })
})

describe('ensureDir', () => {
  afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

  it('creates nested directories', () => {
    const dir = path.join(TMP, 'a', 'b', 'c')
    ensureDir(dir)
    expect(fs.existsSync(dir)).toBe(true)
  })

  it('is idempotent', () => {
    const dir = path.join(TMP, 'idempotent')
    ensureDir(dir)
    expect(() => ensureDir(dir)).not.toThrow()
  })
})

describe('downloadWithFallback', () => {
  const TMP_FB = path.join(__dirname, 'tmp_fallback_test')
  beforeAll(() => fs.mkdirSync(TMP_FB, { recursive: true }))
  afterAll(() => fs.rmSync(TMP_FB, { recursive: true, force: true }))
  afterEach(() => nock.cleanAll())

  it('downloads the first successful candidate', async () => {
    nock('https://cdn.example.com').get('/video.mp4').reply(200, Buffer.from('mp4-data'))

    const candidates: AssetSearchResult[] = [{ url: 'https://cdn.example.com/video.mp4', width: 1920, height: 1080 }]
    const dest = path.join(TMP_FB, 'fallback_ok.mp4')
    const result = await downloadWithFallback(candidates, dest)

    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://cdn.example.com/video.mp4')
    expect(fs.existsSync(dest)).toBe(true)
  })

  it('tries the next candidate when the first fails', async () => {
    nock('https://cdn.example.com').get('/bad.mp4').reply(404)
    nock('https://cdn.example.com').get('/good.mp4').reply(200, Buffer.from('ok'))

    const candidates: AssetSearchResult[] = [
      { url: 'https://cdn.example.com/bad.mp4', width: 1920, height: 1080 },
      { url: 'https://cdn.example.com/good.mp4', width: 1920, height: 1080 },
    ]
    const dest = path.join(TMP_FB, 'fallback_retry.mp4')
    const result = await downloadWithFallback(candidates, dest)

    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://cdn.example.com/good.mp4')
  })

  it('returns null when all candidates fail', async () => {
    nock('https://cdn.example.com').get('/a.mp4').reply(404)
    nock('https://cdn.example.com').get('/b.mp4').reply(500)

    const candidates: AssetSearchResult[] = [
      { url: 'https://cdn.example.com/a.mp4', width: 1920, height: 1080 },
      { url: 'https://cdn.example.com/b.mp4', width: 1920, height: 1080 },
    ]
    const dest = path.join(TMP_FB, 'fallback_all_fail.mp4')
    const result = await downloadWithFallback(candidates, dest)

    expect(result).toBeNull()
  })

  it('returns null for empty candidate list', async () => {
    const dest = path.join(TMP_FB, 'fallback_empty.mp4')
    const result = await downloadWithFallback([], dest)
    expect(result).toBeNull()
  })
})
