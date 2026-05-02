import { execFile } from 'child_process'
import { promisify } from 'util'

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
    '-pix_fmt', 'yuvj420p',
    '-y',
    outputPath,
  ])
  return outputPath
}
