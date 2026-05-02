import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import { getDb } from '.'

export function runMigrations() {
  const db = getDb()
  migrate(db as any, {
    migrationsFolder: path.join(__dirname, '../../drizzle'),
  })
}
