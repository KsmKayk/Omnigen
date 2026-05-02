import fs from 'fs'
import https from 'https'
import http from 'http'
import path from 'path'

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

export function downloadAsset(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    protocol.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        file.destroy()
        fs.unlink(destPath, () => {})
        reject(new Error(`HTTP ${res.statusCode} downloading ${url}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve()))
      file.on('error', (err) => {
        fs.unlink(destPath, () => {})
        reject(err)
      })
    }).on('error', (err) => {
      fs.unlink(destPath, () => {})
      reject(err)
    })
  })
}
