import { googleImageSearch, googleVideoSearch } from '../lib/google-search'
import type { AssetSearchResult } from '../types'

export type { AssetSearchResult }
export type Orientation = 'portrait' | 'landscape'

const CANDIDATES_PER_SCENE = 5

export async function searchImages(
  query: string,
  orientation: Orientation,
): Promise<AssetSearchResult[]> {
  return googleImageSearch(`${query} ${orientation}`, CANDIDATES_PER_SCENE)
}

export async function searchVideos(query: string): Promise<AssetSearchResult[]> {
  return googleVideoSearch(query, CANDIDATES_PER_SCENE)
}
