import { spawn } from 'child_process'
import { config } from '../config'

export async function runPiper(text: string, outputPath: string): Promise<string> {
  const modelPath = config.PIPER_MODEL_PATH

  return new Promise((resolve, reject) => {
    const proc = spawn('python', ['-m', 'piper', '-m', modelPath, '-f', outputPath], {
      env: { ...process.env, PYTHONUTF8: '1' },
    })
    let stderr = ''

    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
    proc.stdin.on('error', reject)
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve(outputPath)
      else reject(new Error(`piper exited with code ${code}: ${stderr}`))
    })

    proc.stdin.write(text, 'utf8')
    proc.stdin.end()
  })
}
