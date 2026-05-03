process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
process.env.NODE_ENV = 'test'

import { logger, createChildLogger, persistLog } from '../../src/lib/logger'

describe('logger', () => {
  it('exports a pino logger instance', () => {
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('createChildLogger returns a child logger with bindings', () => {
    const child = createChildLogger({ generationId: 'abc123' })
    expect(typeof child.info).toBe('function')
  })

  it('persistLog does not throw in test environment', () => {
    expect(() => persistLog('info', 'test message', 'backend')).not.toThrow()
  })

  it('persistLog accepts optional context', () => {
    expect(() =>
      persistLog('error', 'something failed', 'frontend', { key: 'value' })
    ).not.toThrow()
  })
})
