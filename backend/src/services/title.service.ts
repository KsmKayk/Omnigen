import path from 'path'
import { callLLM } from '../lib/openrouter'
import { loadTemplate } from '../lib/template-loader'
import { config } from '../config'
import type { VideoType } from '../types'

const getTemplateFill = () =>
  loadTemplate(
    path.join(config.PROMPTS_PATH, 'text_templates', 'title_generation_template.txt'),
  )

export async function generateTitles(theme: string, videoType: VideoType): Promise<string[]> {
  const fill = getTemplateFill()
  const prompt = fill({ theme, video_type: videoType })

  const response = await callLLM(prompt)
  const titles = response
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (titles.length < 3) {
    throw new Error(`Expected 3 titles from LLM, got ${titles.length}`)
  }

  return titles.slice(0, 3)
}
