import { execFile } from 'child_process'
import { promisify } from 'util'
import { config } from '../config'

const execFileAsync = promisify(execFile)

export async function runPiper(text: string, outputPath: string): Promise<string> {
  const modelPath = config.PIPER_MODEL_PATH

  await execFileAsync('python', [
    '-m',
    'piper',
    '-m',
    modelPath,
    '-f',
    outputPath,
    text,
  ])

  return outputPath
}
