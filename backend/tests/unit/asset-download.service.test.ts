process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
process.env.NODE_ENV = 'test'

import fs from 'fs'
import path from 'path'
import nock from 'nock'
import { downloadAsset, ensureDir } from '../../src/services/asset-download.service'

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
