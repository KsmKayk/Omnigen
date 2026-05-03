import { googleImageSearch, googleVideoSearch } from '../lib/google-search'
import { callLLM } from '../lib/openrouter'
import type { AssetSearchResult } from '../types'

export type { AssetSearchResult }
export type Orientation = 'portrait' | 'landscape'

const CANDIDATES_PER_SCENE = 5
const MIN_IMAGE_WIDTH = 1280
const MIN_IMAGE_HEIGHT = 720

async function sceneToSearchQuery(description: string): Promise<string> {
  const prompt =
    `You are a professional video editor searching for stock footage. ` +
    `Convert the scene description below into a 2-4 word English search query for Google. ` +
    `Focus on the main visual subject. Be specific but concise. ` +
    `Return ONLY the search query, no explanations.\n\nScene: ${description}`
  const result = await callLLM(prompt)
  return result.trim().replace(/^["'`“”‘’]|["'`“”‘’]$/g, '').split('\n')[0].trim()
}

export async function searchImages(
  description: string,
  orientation: Orientation,
): Promise<AssetSearchResult[]> {
  const baseQuery = await sceneToSearchQuery(description)
  const orientTag = orientation === 'portrait' ? 'vertical' : 'horizontal'

  const first = await googleImageSearch(`${baseQuery} ${orientTag} HD`, CANDIDATES_PER_SCENE)
  const hdFirst = first.filter((r) => r.width >= MIN_IMAGE_WIDTH || r.height >= MIN_IMAGE_HEIGHT)
  if (hdFirst.length > 0) return hdFirst

  // Retry without orientation/HD — wider net, same resolution gate
  const second = await googleImageSearch(baseQuery, CANDIDATES_PER_SCENE)
  return second.filter((r) => r.width >= MIN_IMAGE_WIDTH || r.height >= MIN_IMAGE_HEIGHT)
}

export async function searchVideos(description: string): Promise<AssetSearchResult[]> {
  const baseQuery = await sceneToSearchQuery(description)

  const first = await googleVideoSearch(`${baseQuery} cinematic 4K footage`, CANDIDATES_PER_SCENE)
  if (first.length > 0) return first

  return googleVideoSearch(baseQuery, CANDIDATES_PER_SCENE)
}
