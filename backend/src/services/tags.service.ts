import path from 'path'
import { callLLM } from '../lib/openrouter'
import { loadTemplate } from '../lib/template-loader'
import { config } from '../config'

export async function generateTags(scriptText: string): Promise<string[]> {
  const fill = loadTemplate(
    path.join(config.PROMPTS_PATH, 'text_templates', 'tags_template.txt'),
  )
  const prompt = fill({ script: scriptText })
  const response = await callLLM(prompt)

  return response
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 10)
}
