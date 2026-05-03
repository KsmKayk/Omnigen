export type Orientation = 'portrait' | 'landscape'

export interface AssetSearchResult {
  url: string
  width: number
  height: number
}

export async function searchImages(
  _query: string,
  _orientation: Orientation,
): Promise<AssetSearchResult | null> {
  return null
}

export async function searchVideos(_query: string): Promise<AssetSearchResult | null> {
  return null
}
