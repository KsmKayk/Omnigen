import { googleImageSearch, googleVideoSearch } from '../lib/google-search'
import { callLLM } from '../lib/openrouter'
import type { AssetSearchResult } from '../types'

export type { AssetSearchResult }
export type Orientation = 'portrait' | 'landscape'

const CANDIDATES_PER_SCENE = 5

async function simplifyQuery(query: string): Promise<string> {
  const prompt =
    `Extract 2-3 key visual English keywords from the scene description below that work as a Google image search query. ` +
    `Return only the keywords separated by spaces, nothing else.\n\nScene: ${query}`
  const result = await callLLM(prompt)
  return result.trim().replace(/["""'']/g, '').split('\n')[0].trim()
}

export async function searchImages(
  query: string,
  orientation: Orientation,
): Promise<AssetSearchResult[]> {
  const results = await googleImageSearch(`${query} ${orientation}`, CANDIDATES_PER_SCENE)
  if (results.length > 0) return results

  const simplified = await simplifyQuery(query)
  return googleImageSearch(`${simplified} ${orientation}`, CANDIDATES_PER_SCENE)
}

export async function searchVideos(query: string): Promise<AssetSearchResult[]> {
  const results = await googleVideoSearch(query, CANDIDATES_PER_SCENE)
  if (results.length > 0) return results

  const simplified = await simplifyQuery(query)
  return googleVideoSearch(simplified, CANDIDATES_PER_SCENE)
}
