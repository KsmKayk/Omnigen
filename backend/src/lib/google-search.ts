import https from 'https'
import { config } from '../config'
import type { AssetSearchResult } from '../types'

interface SerpImageResult {
  original?: string
  original_width?: number
  original_height?: number
}

interface SerpOrganicResult {
  link?: string
}

interface SerpResponse {
  images_results?: SerpImageResult[]
  organic_results?: SerpOrganicResult[]
  error?: string
}

function serpFetch(params: Record<string, string>): Promise<SerpResponse> {
  const qs = new URLSearchParams({ ...params, api_key: config.SERPAPI_KEY }).toString()
  const url = `https://serpapi.com/search.json?${qs}`

  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        let parsed: SerpResponse
        try {
          parsed = JSON.parse(data) as SerpResponse
        } catch (e) {
          reject(new Error(`Failed to parse SerpAPI response: ${e}`))
          return
        }
        const status = res.statusCode ?? 0
        if (status >= 400) {
          reject(new Error(`SerpAPI HTTP ${status}: ${parsed.error ?? data}`))
          return
        }
        // "no results" is a soft response — resolve as empty, not an error
        resolve(parsed)
      })
    })
    req.on('error', reject)
  })
}

export async function googleImageSearch(query: string, count: number): Promise<AssetSearchResult[]> {
  const data = await serpFetch({
    engine: 'google_images',
    q: query,
    num: String(Math.min(count, 10)),
  })

  return (data.images_results ?? [])
    .filter((item) => !!item.original)
    .slice(0, count)
    .map((item) => ({
      url: item.original!,
      width: item.original_width ?? 1920,
      height: item.original_height ?? 1080,
    }))
}

export async function googleVideoSearch(query: string, count: number): Promise<AssetSearchResult[]> {
  const data = await serpFetch({
    engine: 'google',
    q: `${query} filetype:mp4 -site:youtube.com -site:vimeo.com -site:dailymotion.com`,
    num: String(Math.min(count, 10)),
  })

  return (data.organic_results ?? [])
    .filter((item) => !!item.link && /\.mp4(\?|$)/i.test(item.link))
    .slice(0, count)
    .map((item) => ({
      url: item.link!,
      width: 1920,
      height: 1080,
    }))
}
