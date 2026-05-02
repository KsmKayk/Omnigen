import path from 'path'
import { callLLM } from '../lib/openrouter'
import { loadTemplate } from '../lib/template-loader'
import { config } from '../config'
import type { VideoType, SceneBlock } from '../types'

function getTemplatePath(videoType: VideoType): string {
  const file = videoType === 'short' ? 'short_template.txt' : 'long_template.txt'
  return path.join(config.PROMPTS_PATH, 'text_templates', file)
}

function cleanNarration(text: string): string {
  return text.replace(/^(narrator|narrador)\s*:\s*/i, '').trim()
}

function parseScenes(raw: string): SceneBlock[] {
  const scenes: SceneBlock[] = []
  // Match [CENA N] Description\nNarration text
  const lines = raw.split('\n')
  let currentScene: Partial<SceneBlock> | null = null
  const narrationLines: string[] = []

  for (const line of lines) {
    const sceneMatch = line.match(/^\[CENA\s+(\d+)\]\s*(.*)$/)
    if (sceneMatch) {
      // Save previous scene
      if (currentScene?.sceneId !== undefined) {
        scenes.push({
          sceneId: currentScene.sceneId,
          description: currentScene.description ?? '',
          narration: cleanNarration(narrationLines.join('\n').trim()),
        })
        narrationLines.length = 0
      }
      currentScene = {
        sceneId: parseInt(sceneMatch[1], 10),
        description: sceneMatch[2].trim(),
      }
    } else if (currentScene) {
      narrationLines.push(line)
    }
  }

  // Push last scene
  if (currentScene?.sceneId !== undefined) {
    scenes.push({
      sceneId: currentScene.sceneId,
      description: currentScene.description ?? '',
      narration: narrationLines.join('\n').trim(),
    })
  }

  return scenes
}

export async function generateScript(
  theme: string,
  videoType: VideoType,
  title: string,
): Promise<SceneBlock[]> {
  const fill = loadTemplate(getTemplatePath(videoType))
  const prompt = fill({ title, theme })

  const response = await callLLM(prompt)
  const scenes = parseScenes(response)

  if (scenes.length === 0) {
    throw new Error('No scenes parsed from LLM script output')
  }

  return scenes
}
