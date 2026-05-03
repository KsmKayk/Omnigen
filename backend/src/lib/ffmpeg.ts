import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execFileAsync = promisify(execFile)

function getFfmpegPath(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { config } = require('../config') as { config: { FFMPEG_PATH: string } }
  return config.FFMPEG_PATH
}

export async function getAudioDurationMs(wavPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobePath = getFfmpegPath().replace(/ffmpeg(\.exe)?$/i, (_, ext) => `ffprobe${ext ?? ''}`)

    execFile(
      ffprobePath,
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', wavPath],
      (err, stdout, stderr) => {
        const floatMs = parseFloat(stdout.trim())
        if (!isNaN(floatMs)) {
          resolve(Math.round(floatMs * 1000))
          return
        }

        const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/)
        if (durationMatch) {
          const h = parseInt(durationMatch[1])
          const m = parseInt(durationMatch[2])
          const s = parseInt(durationMatch[3])
          const cs = parseInt(durationMatch[4].padEnd(3, '0').slice(0, 3))
          resolve(h * 3_600_000 + m * 60_000 + s * 1_000 + cs)
          return
        }

        reject(err ?? new Error(`Could not parse duration from ffprobe output: "${stdout.trim() || stderr.trim()}"`))
      },
    )
  })
}

interface ConcatAsset {
  localPath: string
  type: 'image' | 'video'
}

export function buildConcatFile(assets: ConcatAsset[], durationPerSceneMs: number): string {
  const durationSecs = durationPerSceneMs / 1000
  return assets
    .map(({ localPath, type }) => {
      const p = localPath.replace(/\\/g, '/')
      if (type === 'video') {
        // Videos are pre-trimmed to exact scene duration before concatenation
        return `file '${p}'`
      }
      return `file '${p}'\nduration ${durationSecs}`
    })
    .join('\n')
}

export async function concatenateAudioFiles(inputPaths: string[], outputPath: string): Promise<void> {
  const listPath = outputPath + '.txt'
  const content = inputPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n')
  fs.writeFileSync(listPath, content, 'utf-8')
  try {
    await execFileAsync(getFfmpegPath(), ['-f', 'concat', '-safe', '0', '-i', listPath, '-y', outputPath])
  } finally {
    try { fs.unlinkSync(listPath) } catch { /* ignore */ }
  }
}

export async function extractFrame(
  videoPath: string,
  outputPath: string,
  seekSeconds: number,
): Promise<string> {
  await execFileAsync(getFfmpegPath(), [
    '-ss', String(seekSeconds),
    '-i', videoPath,
    '-frames:v', '1',
    '-q:v', '2',
    '-pix_fmt', 'yuvj420p',
    '-y',
    outputPath,
  ])
  return outputPath
}
