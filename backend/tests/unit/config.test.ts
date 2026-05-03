import path from 'path'

describe('config', () => {
  const REQUIRED_VARS = {
    OPENROUTER_API_KEY: 'test-key',
    GOOGLE_API_KEY: 'test-google-key',
    GOOGLE_CSE_ID: 'test-cse-id',
  }

  beforeEach(() => {
    // Set required vars before each test
    Object.assign(process.env, REQUIRED_VARS)
  })

  afterEach(() => {
    // Clean up
    delete process.env.OPENROUTER_API_KEY
    delete process.env.GOOGLE_API_KEY
    delete process.env.GOOGLE_CSE_ID
    delete process.env.PORT
    jest.resetModules()
  })

  it('throws on missing OPENROUTER_API_KEY', () => {
    delete process.env.OPENROUTER_API_KEY
    jest.resetModules()
    expect(() => require('../../src/config')).toThrow('Invalid environment variables')
  })

  it('throws when GOOGLE_API_KEY is missing', () => {
    jest.resetModules()
    const saved = process.env.GOOGLE_API_KEY
    delete process.env.GOOGLE_API_KEY
    expect(() => require('../../src/config')).toThrow('Invalid environment variables')
    process.env.GOOGLE_API_KEY = saved ?? 'test'
  })

  it('throws when GOOGLE_CSE_ID is missing', () => {
    jest.resetModules()
    const saved = process.env.GOOGLE_CSE_ID
    delete process.env.GOOGLE_CSE_ID
    expect(() => require('../../src/config')).toThrow('Invalid environment variables')
    process.env.GOOGLE_CSE_ID = saved ?? 'test'
  })

  it('parses PORT as number', () => {
    process.env.PORT = '3001'
    jest.resetModules()
    const { config } = require('../../src/config')
    expect(typeof config.PORT).toBe('number')
    expect(config.PORT).toBe(3001)
  })

  it('uses default PORT 3001 when not set', () => {
    delete process.env.PORT
    jest.resetModules()
    const { config } = require('../../src/config')
    expect(config.PORT).toBe(3001)
  })

  it('resolves STORAGE_PATH to absolute path', () => {
    jest.resetModules()
    const { config } = require('../../src/config')
    expect(path.isAbsolute(config.STORAGE_PATH)).toBe(true)
  })
})
