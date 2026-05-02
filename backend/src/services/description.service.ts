import path from 'path'
import { callLLM } from '../lib/openrouter'
import { loadTemplate } from '../lib/template-loader'
import { config } from '../config'

export async function generateDescription(scriptText: string): Promise<string> {
  const fill = loadTemplate(
    path.join(config.PROMPTS_PATH, 'text_templates', 'description_template.txt'),
  )
  const prompt = fill({ script: scriptText })
  return callLLM(prompt)
}
