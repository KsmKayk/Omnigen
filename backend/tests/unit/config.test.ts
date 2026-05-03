import path from 'path'

describe('config', () => {
  const REQUIRED_VARS = {
    OPENROUTER_API_KEY: 'test-key',
    SERPAPI_KEY: 'test-serpapi-key',
  }

  beforeEach(() => {
    Object.assign(process.env, REQUIRED_VARS)
  })

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY
    delete process.env.SERPAPI_KEY
    delete process.env.PORT
    jest.resetModules()
  })

  it('throws on missing OPENROUTER_API_KEY', () => {
    delete process.env.OPENROUTER_API_KEY
    jest.resetModules()
    expect(() => require('../../src/config')).toThrow('Invalid environment variables')
  })

  it('throws when SERPAPI_KEY is missing', () => {
    jest.resetModules()
    const saved = process.env.SERPAPI_KEY
    delete process.env.SERPAPI_KEY
    expect(() => require('../../src/config')).toThrow('Invalid environment variables')
    process.env.SERPAPI_KEY = saved ?? 'test'
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
