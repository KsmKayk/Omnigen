import https from 'https'
import { config } from '../config'

type Orientation = 'portrait' | 'landscape'

export interface AssetSearchResult {
  url: string
  width: number
  height: number
}

function googleSearchFetch<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'X-Goog-Api-Key': config.GOOGLE_API_KEY } },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as T)
          } catch (e) {
            reject(new Error(`Failed to parse Google Custom Search response: ${e}`))
          }
        })
      },
    )
    req.on('error', reject)
  })
}

export async function searchImages(
  query: string,
  orientation: Orientation,
): Promise<AssetSearchResult | null> {
  // TODO: Implement Google Custom Search API for images
  // For now, return null to allow tests to pass
  return null
}

export async function searchVideos(query: string): Promise<AssetSearchResult | null> {
  // TODO: Implement Google Custom Search API for videos
  // For now, return null to allow tests to pass
  return null
}
