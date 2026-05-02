import OpenAI from 'openai'
import { config } from '../config'

const client = new OpenAI({
  apiKey: config.OPENROUTER_API_KEY,
  baseURL: config.OPENROUTER_BASE_URL,
})

export async function callLLM(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

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
}
