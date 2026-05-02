import path from 'path'

describe('config', () => {
  const REQUIRED_VARS = {
    OPENROUTER_API_KEY: 'test-key',
    PEXELS_API_KEY: 'test-pexels',
  }

  beforeEach(() => {
    // Set required vars before each test
    Object.assign(process.env, REQUIRED_VARS)
  })

  afterEach(() => {
    // Clean up
    delete process.env.OPENROUTER_API_KEY
    delete process.env.PEXELS_API_KEY
    delete process.env.PORT
    jest.resetModules()
  })

  it('throws on missing OPENROUTER_API_KEY', () => {
    delete process.env.OPENROUTER_API_KEY
    jest.resetModules()
    expect(() => require('../../src/config')).toThrow('Invalid environment variables')
  })

  it('throws on missing PEXELS_API_KEY', () => {
    delete process.env.PEXELS_API_KEY
    jest.resetModules()
    expect(() => require('../../src/config')).toThrow('Invalid environment variables')
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
