import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../../src/db/schema'

describe('database schema', () => {
  it('creates generations and logs tables', () => {
    const sqlite = new Database(':memory:')
    const db = drizzle(sqlite, { schema })

    // Manually create tables (simulating what migrations would do)
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

    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[]

    const names = tables.map((t) => t.name)
    expect(names).toContain('generations')
    expect(names).toContain('logs')

    // Test that we can insert and query
    db.insert(schema.generations).values({
      id: 'test-1',
      theme: 'Zeus',
      videoType: 'short',
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).run()

    const rows = db.select().from(schema.generations).all()
    expect(rows).toHaveLength(1)
    expect(rows[0].theme).toBe('Zeus')

    sqlite.close()
  })
})
