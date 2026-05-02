import https from 'https'
import { config } from '../config'

type Orientation = 'portrait' | 'landscape'

export interface AssetSearchResult {
  url: string
  width: number
  height: number
}

function pexelsFetch<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { Authorization: config.PEXELS_API_KEY } },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as T)
          } catch (e) {
            reject(new Error(`Failed to parse Pexels response: ${e}`))
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
  const params = new URLSearchParams({ query, per_page: '1', orientation })

  const data = await pexelsFetch<{
    photos: { src: { original: string }; width: number; height: number }[]
  }>(`https://api.pexels.com/v1/search?${params}`)

  const photo = data.photos[0]
  if (!photo) return null

  return { url: photo.src.original, width: photo.width, height: photo.height }
}

export async function searchVideos(query: string): Promise<AssetSearchResult | null> {
  const params = new URLSearchParams({ query, per_page: '1' })

  const data = await pexelsFetch<{
    videos: { video_files: { link: string; width: number; height: number }[] }[]
  }>(`https://api.pexels.com/videos/search?${params}`)

  const video = data.videos[0]
  if (!video) return null

  const file = video.video_files[0]
  if (!file) return null

  return { url: file.link, width: file.width, height: file.height }
}
