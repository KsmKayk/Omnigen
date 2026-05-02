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
