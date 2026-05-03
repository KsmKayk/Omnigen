import { z } from 'zod'
import path from 'path'

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().default('openai/gpt-4o-mini'),

  PIPER_MODEL_PATH: z.string().default('pt_BR-faber-medium'),
  FFMPEG_PATH: z.string().default('ffmpeg'),

  SERPAPI_KEY: z.string().min(1),

  DATABASE_URL: z.string().default('./storage/omnigen.db'),
  STORAGE_PATH: z.string().default('./storage'),
  PROMPTS_PATH: z.string().default('./prompts_templates'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const config = {
  ...parsed.data,
  PIPER_MODEL_PATH: path.resolve(parsed.data.PIPER_MODEL_PATH),
  DATABASE_URL: path.resolve(parsed.data.DATABASE_URL),
  STORAGE_PATH: path.resolve(parsed.data.STORAGE_PATH),
  PROMPTS_PATH: path.resolve(parsed.data.PROMPTS_PATH),
}
