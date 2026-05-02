process.env.OPENROUTER_API_KEY = 'test-key'
process.env.PEXELS_API_KEY = 'test-key'
process.env.NODE_ENV = 'test'

import nock from 'nock'

describe('callLLM', () => {
  let callLLM: (prompt: string, systemPrompt?: string) => Promise<string>

  beforeAll(() => {
    const mod = require('../../src/lib/openrouter')
    callLLM = mod.callLLM
  })

  afterEach(() => nock.cleanAll())

  it('returns assistant message content', async () => {
    nock('https://openrouter.ai')
      .post('/api/v1/chat/completions')
      .reply(200, {
        choices: [{ message: { role: 'assistant', content: 'Hello world' } }],
      })

    const result = await callLLM('Say hello')
    expect(result).toBe('Hello world')
  })

  it('trims whitespace from response', async () => {
    nock('https://openrouter.ai')
      .post('/api/v1/chat/completions')
      .reply(200, {
        choices: [{ message: { role: 'assistant', content: '  Hello world  \n' } }],
      })

    const result = await callLLM('Say hello')
    expect(result).toBe('Hello world')
  })

  it('throws on empty choices', async () => {
    nock('https://openrouter.ai')
      .post('/api/v1/chat/completions')
      .reply(200, { choices: [] })

    await expect(callLLM('test')).rejects.toThrow('LLM returned empty response')
  })

  it('retries on ECONNRESET and succeeds', async () => {
    nock('https://openrouter.ai').post('/api/v1/chat/completions').replyWithError({ code: 'ECONNRESET' })
    nock('https://openrouter.ai')
      .post('/api/v1/chat/completions')
      .reply(200, { choices: [{ message: { role: 'assistant', content: 'Retried OK' } }] })

    await expect(callLLM('test')).resolves.toBe('Retried OK')
  })

  it('throws after max retries', async () => {
    for (let i = 0; i < 3; i++) {
      nock('https://openrouter.ai').post('/api/v1/chat/completions').replyWithError({ code: 'ECONNRESET' })
    }

    await expect(callLLM('test')).rejects.toThrow()
  })

  it('includes system prompt when provided', async () => {
    let capturedBody: any

    nock('https://openrouter.ai')
      .post('/api/v1/chat/completions', (body) => {
        capturedBody = body
        return true
      })
      .reply(200, {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      })

    await callLLM('User prompt', 'You are a helpful assistant')

    expect(capturedBody.messages).toHaveLength(2)
    expect(capturedBody.messages[0].role).toBe('system')
    expect(capturedBody.messages[0].content).toBe('You are a helpful assistant')
    expect(capturedBody.messages[1].role).toBe('user')
  })
})
