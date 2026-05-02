import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type * as schema from './schema'

// db will be initialized by initDb() before use
let _db: BetterSQLite3Database<typeof schema> | null = null

export function initDb(databaseUrl: string) {
  const Database = require('better-sqlite3')
  const { drizzle } = require('drizzle-orm/better-sqlite3')
  const sqlite = new Database(databaseUrl)
  _db = drizzle(sqlite, { schema: require('./schema') })
  return _db!
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.')
  return _db
}

// Convenience proxy - used after initDb is called
export { schema }
