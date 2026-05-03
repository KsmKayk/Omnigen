import fs from 'fs'
import https from 'https'
import http from 'http'
import { execFile } from 'child_process'
import { promisify } from 'util'
import type { AssetSearchResult } from '../types'

const execFileAsync = promisify(execFile)
const MAX_REDIRECTS = 5

function getFfmpegPath(): string {
  const { config } = require('../config') as { config: { FFMPEG_PATH: string } }
  return config.FFMPEG_PATH
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

export function downloadAsset(url: string, destPath: string, redirectCount = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    const req = protocol.get(url, (res) => {
      const status = res.statusCode ?? 0

      if (status >= 300 && status < 400) {
        file.destroy()
        fs.unlink(destPath, () => {})
        const location = res.headers.location
        if (!location) {
          reject(new Error(`Redirect without Location from ${url}`))
          return
        }
        if (redirectCount >= MAX_REDIRECTS) {
          reject(new Error(`Too many redirects from ${url}`))
          return
        }
        const nextUrl = location.startsWith('http') ? location : new URL(location, url).href
        resolve(downloadAsset(nextUrl, destPath, redirectCount + 1))
        return
      }

      if (status >= 400) {
        file.destroy()
        fs.unlink(destPath, () => {})
        reject(new Error(`HTTP ${status} downloading ${url}`))
        return
      }

      res.pipe(file)
      file.on('finish', () =>
        file.close(() => {
          try {
            if (fs.statSync(destPath).size === 0) {
              fs.unlinkSync(destPath)
              reject(new Error(`Empty response body from ${url}`))
              return
            }
          } catch (e) {
            reject(e)
            return
          }
          resolve()
        }),
      )
      file.on('error', (err) => {
        fs.unlink(destPath, () => {})
        reject(err)
      })
    })
    req.on('error', (err) => {
      fs.unlink(destPath, () => {})
      reject(err)
    })
  })
}

export async function downloadVideoSegment(url: string, destPath: string, maxSeconds = 30): Promise<void> {
  const ffmpegPath = getFfmpegPath()

  // Direct .mp4 URL — stream only the needed seconds via ffmpeg
  if (/\.mp4(\?|$)/i.test(url)) {
    await execFileAsync(ffmpegPath, ['-i', url, '-t', String(maxSeconds), '-c', 'copy', '-y', destPath])
    return
  }

  // Platform URL (YouTube, Vimeo, etc.) — use yt-dlp to download just the segment
  try {
    await execFileAsync('yt-dlp', [
      '--download-sections', `*0:00-${maxSeconds}`,
      '--no-playlist',
      '-f', 'bestvideo[height<=1080]+bestaudio/best',
      '--merge-output-format', 'mp4',
      '--no-warnings',
      '-o', destPath,
      url,
    ])
    // yt-dlp appends .mp4 when destPath has no .mp4 extension (e.g. tmpPath = scene.mp4.tmp0 → scene.mp4.tmp0.mp4)
    const ytdlpOut = `${destPath}.mp4`
    if (!fs.existsSync(destPath) && fs.existsSync(ytdlpOut)) {
      fs.renameSync(ytdlpOut, destPath)
    }
    return
  } catch (err) {
    console.warn(`[video] yt-dlp failed for ${url}: ${(err as Error).message?.slice(0, 300)}`)
    try { fs.unlinkSync(`${destPath}.mp4`) } catch { /* already gone */ }
  }

  await execFileAsync(ffmpegPath, ['-i', url, '-t', String(maxSeconds), '-c', 'copy', '-y', destPath])
}

export async function downloadWithFallback(
  candidates: AssetSearchResult[],
  destPath: string,
): Promise<AssetSearchResult | null> {
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const tmpPath = `${destPath}.tmp${i}`
    try {
      await downloadAsset(candidate.url, tmpPath)
      fs.renameSync(tmpPath, destPath)
      return candidate
    } catch {
      try { fs.unlinkSync(tmpPath) } catch { /* already gone */ }
    }
  }
  return null
}

export async function downloadVideoWithFallback(
  candidates: AssetSearchResult[],
  destPath: string,
  maxSeconds = 30,
): Promise<AssetSearchResult | null> {
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const tmpPath = `${destPath}.tmp${i}`
    try {
      await downloadVideoSegment(candidate.url, tmpPath, maxSeconds)
      const size = fs.existsSync(tmpPath) ? fs.statSync(tmpPath).size : 0
      if (size === 0) {
        try { fs.unlinkSync(tmpPath) } catch { }
        continue
      }
      fs.renameSync(tmpPath, destPath)
      return candidate
    } catch {
      try { fs.unlinkSync(tmpPath) } catch { /* already gone */ }
    }
  }
  return null
}
