import fs from 'fs'
import path from 'path'
import { prepareStorageDirs } from '../../src/startup'

process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'

const TMP = path.join(__dirname, 'tmp_startup_test')
process.env.STORAGE_PATH = TMP

describe('prepareStorageDirs', () => {
  afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

  it('creates output and temp subdirectories', () => {
    prepareStorageDirs(TMP)
    expect(fs.existsSync(path.join(TMP, 'output'))).toBe(true)
    expect(fs.existsSync(path.join(TMP, 'temp'))).toBe(true)
  })

  it('is idempotent — does not throw if dirs already exist', () => {
    expect(() => prepareStorageDirs(TMP)).not.toThrow()
  })
})
