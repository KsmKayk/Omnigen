process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'
process.env.STORAGE_PATH = './tests/integration/tmp_storage'

import request from 'supertest'
import fs from 'fs'
import path from 'path'
import { createApp } from '../../src/server'

describe('static file serving', () => {
  const tmpDir = path.resolve('./tests/integration/tmp_storage/output/gen1')

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(path.join(tmpDir, 'video.mp4'), 'fake-video-content')
  })

  afterAll(() => {
    fs.rmSync(path.resolve('./tests/integration/tmp_storage'), { recursive: true, force: true })
  })

  it('serves files from storage/output via /output route', async () => {
    const app = createApp()
    const res = await request(app).get('/output/gen1/video.mp4')
    expect(res.status).toBe(200)
  })
})
