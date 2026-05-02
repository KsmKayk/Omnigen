process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'
process.env.DATABASE_URL = ':memory:'

import request from 'supertest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../../src/db/schema'
import { setDb, resetDb } from '../../src/db'
import { createApp } from '../../src/server'
import * as titleSvc from '../../src/services/title.service'

jest.mock('../../src/services/title.service')
jest.mock('../../src/services/pipeline.service')

const mockGenerateTitles = titleSvc.generateTitles as jest.MockedFunction<typeof titleSvc.generateTitles>

function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      theme TEXT NOT NULL,
      video_type TEXT NOT NULL,
      suggested_titles TEXT,
      selected_title TEXT,
      script TEXT,
      assets_json TEXT,
      tts_path TEXT,
      subtitle_path TEXT,
      video_path TEXT,
      thumbnails_json TEXT,
      tags TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      source TEXT NOT NULL,
      context_json TEXT,
      created_at INTEGER NOT NULL
    )
  `)
  return drizzle(sqlite, { schema })
}

beforeEach(() => {
  resetDb()
  setDb(createTestDb())
  jest.clearAllMocks()
})

afterEach(() => {
  resetDb()
})

describe('POST /api/generation/start', () => {
  it('returns 400 if theme is missing', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/generation/start')
      .send({ videoType: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/theme/)
  })

  it('returns 400 if videoType is invalid', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/generation/start')
      .send({ theme: 'Zeus', videoType: 'medium' })

    expect(res.status).toBe(400)
  })

  it('returns generationId on valid request', async () => {
    mockGenerateTitles.mockResolvedValueOnce(['Title A', 'Title B', 'Title C'])
    const app = createApp()
    const res = await request(app)
      .post('/api/generation/start')
      .send({ theme: 'Zeus', videoType: 'short' })

    expect(res.status).toBe(200)
    expect(res.body.generationId).toBeDefined()
    expect(res.body.titles).toHaveLength(3)
  })
})

describe('POST /api/generation/:id/select-title', () => {
  it('returns 404 for unknown generation id', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/generation/nonexistent-id/select-title')
      .send({ titleIndex: 0 })

    expect(res.status).toBe(404)
  })

  it('returns selected title on valid request', async () => {
    mockGenerateTitles.mockResolvedValueOnce(['Title A', 'Title B', 'Title C'])
    const app = createApp()

    const startRes = await request(app)
      .post('/api/generation/start')
      .send({ theme: 'Zeus', videoType: 'short' })

    const { generationId } = startRes.body

    const res = await request(app)
      .post(`/api/generation/${generationId}/select-title`)
      .send({ titleIndex: 1 })

    expect(res.status).toBe(200)
    expect(res.body.selectedTitle).toBe('Title B')
  })

  it('returns 400 for invalid titleIndex', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/generation/some-id/select-title')
      .send({ titleIndex: 5 })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/generation/:id/stream', () => {
  it('returns 404 for non-existent generation stream', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/api/generation/nonexistent-id/stream')

    expect(res.status).toBe(404)
  })
})
