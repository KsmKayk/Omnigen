import fs from 'fs'
import path from 'path'
import { initDb, runMigrations } from './db'
import { logger } from './lib/logger'

export function prepareStorageDirs(storagePath: string): void {
  const dirs = [
    path.join(storagePath, 'output'),
    path.join(storagePath, 'temp'),
  ]
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function runStartup(storagePath: string, databaseUrl: string): void {
  logger.info('running startup checks')
  initDb(databaseUrl)
  runMigrations()
  logger.info('database migrations applied')
  prepareStorageDirs(storagePath)
  logger.info({ storagePath }, 'storage directories ready')
}
