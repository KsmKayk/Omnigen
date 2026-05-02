import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

function getFfmpegPath(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { config } = require('../config') as { config: { FFMPEG_PATH: string } }
  return config.FFMPEG_PATH
}

export async function getAudioDurationMs(wavPath: string): Promise<number> {
  const ffprobePath = getFfmpegPath().replace('ffmpeg', 'ffprobe')

  return new Promise((resolve, reject) => {
    execFile(
      ffprobePath,
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', wavPath],
      (_err, stdout, stderr) => {
        const source = stdout.trim() || stderr
        const match = source.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/) ||
          stdout.match(/^(\d+\.\d+)/)

        if (!match) {
          const float = parseFloat(stdout.trim())
          if (!isNaN(float)) {
            resolve(Math.round(float * 1000))
            return
          }
          reject(new Error(`Could not parse duration from: ${source}`))
          return
        }

        if (match.length >= 5) {
          const h = parseInt(match[1])
          const m = parseInt(match[2])
          const s = parseInt(match[3])
          const cs = parseInt(match[4].padEnd(3, '0').slice(0, 3))
          resolve(h * 3_600_000 + m * 60_000 + s * 1_000 + cs)
        } else {
          resolve(Math.round(parseFloat(match[1]) * 1000))
        }
      },
    )
  })
}

export function buildConcatFile(imagePaths: string[], durationPerSceneMs: number): string {
  const durationSecs = durationPerSceneMs / 1000
  return imagePaths
    .map((p) => `file '${p.replace(/\\/g, '/')}'\nduration ${durationSecs}`)
    .join('\n')
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
    '-y',
    outputPath,
  ])
  return outputPath
}
