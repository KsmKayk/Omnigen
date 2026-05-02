import OpenAI from 'openai'
import { config } from '../config'

const client = new OpenAI({
  apiKey: config.OPENROUTER_API_KEY,
  baseURL: config.OPENROUTER_BASE_URL,
})

const RETRYABLE = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'])
const MAX_RETRIES = 3
const RETRY_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 2000

function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const code = (err as NodeJS.ErrnoException).code
    if (code && RETRYABLE.has(code)) return true
    if (err.message.includes('ECONNRESET') || err.message.includes('Invalid response body')) return true
  }
  return false
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function callLLM(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: config.OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
      })

      const content = response.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('LLM returned empty response')
      }

      return content.trim()
    } catch (err) {
      lastErr = err
      if (attempt < MAX_RETRIES && isRetryable(err)) {
        await sleep(RETRY_DELAY_MS * attempt)
        continue
      }
      throw err
    }
  }

  throw lastErr
}
