import https from 'https'
import { config } from '../config'
import type { AssetSearchResult } from '../types'

interface CseItem {
  link: string
  image?: { width: number; height: number }
}

interface CseResponse {
  items?: CseItem[]
}

interface CseErrorResponse {
  error?: { code?: number; message?: string }
}

function cseFetch(url: string): Promise<CseResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        let parsed: CseResponse & CseErrorResponse
        try {
          parsed = JSON.parse(data) as CseResponse & CseErrorResponse
        } catch (e) {
          reject(new Error(`Failed to parse Google CSE response: ${e}`))
          return
        }
        const status = res.statusCode ?? 0
        if (status >= 400) {
          const msg = parsed.error?.message ?? `HTTP ${status}`
          reject(new Error(`Google CSE error ${parsed.error?.code ?? status}: ${msg}`))
          return
        }
        resolve(parsed)
      })
    })
    req.on('error', reject)
  })
}

export async function googleImageSearch(query: string, count: number): Promise<AssetSearchResult[]> {
  const params = new URLSearchParams({
    key: config.GOOGLE_API_KEY,
    cx: config.GOOGLE_CSE_ID,
    q: query,
    searchType: 'image',
    num: String(Math.min(count, 10)),
    imgSize: 'large',
  })

  const data = await cseFetch(`https://www.googleapis.com/customsearch/v1?${params}`)

  return (data.items ?? []).map((item) => ({
    url: item.link,
    width: item.image?.width ?? 1920,
    height: item.image?.height ?? 1080,
  }))
}

export async function googleVideoSearch(query: string, count: number): Promise<AssetSearchResult[]> {
  const params = new URLSearchParams({
    key: config.GOOGLE_API_KEY,
    cx: config.GOOGLE_CSE_ID,
    q: `${query} filetype:mp4 -site:youtube.com -site:vimeo.com -site:dailymotion.com`,
    num: String(Math.min(count, 10)),
  })

  const data = await cseFetch(`https://www.googleapis.com/customsearch/v1?${params}`)

  return (data.items ?? [])
    .filter((item) => /\.mp4(\?|$)/i.test(item.link))
    .map((item) => ({
      url: item.link,
      width: 1920,
      height: 1080,
    }))
}
