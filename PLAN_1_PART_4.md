# Omnigen — Tasks 17–23: Render, Thumbnail, Pipeline Orchestrator + SSE

> **Prerequisite:** Tasks 1–16 from `PLAN_1_PART_2.md` and `PLAN_1_PART_3.md` must be complete.

---

### Task 17: FFmpeg Wrapper

**Files:**
- Create: `backend/src/lib/ffmpeg.ts`
- Test: `backend/tests/unit/ffmpeg.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/ffmpeg.test.ts`:
```typescript
import { getAudioDurationMs, buildConcatFile } from '../../src/lib/ffmpeg'
import * as childProcess from 'child_process'

jest.mock('child_process')
process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const mockExecFile = childProcess.execFile as jest.MockedFunction<typeof childProcess.execFile>

describe('getAudioDurationMs', () => {
  it('parses ffprobe duration output', async () => {
    // ffprobe outputs duration to stderr
    mockExecFile.mockImplementation((_cmd, _args, callback: any) => {
      callback(null, '', 'Duration: 00:00:52.34, start: 0')
      return {} as any
    })

    const ms = await getAudioDurationMs('/tmp/narration.wav')
    expect(ms).toBe(52340)
  })
})

describe('buildConcatFile', () => {
  it('generates ffmpeg concat file content', () => {
    const content = buildConcatFile(['/tmp/scene1.jpg', '/tmp/scene2.jpg'], 5000)
    expect(content).toContain("file '/tmp/scene1.jpg'")
    expect(content).toContain('duration 5')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/ffmpeg.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/lib/ffmpeg.ts`**

```typescript
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { config } from '../config'

const execFileAsync = promisify(execFile)

export async function getAudioDurationMs(wavPath: string): Promise<number> {
  const ffprobePath = config.FFMPEG_PATH.replace('ffmpeg', 'ffprobe')

  return new Promise((resolve, reject) => {
    execFile(
      ffprobePath,
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', wavPath],
      (_err, stdout, stderr) => {
        // ffprobe may write to stderr; try stdout first
        const source = stdout.trim() || stderr
        const match = source.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/) ||
          stdout.match(/^(\d+\.\d+)/)

        if (!match) {
          // fallback: try parsing plain float from stdout
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
  await execFileAsync(config.FFMPEG_PATH, [
    '-ss', String(seekSeconds),
    '-i', videoPath,
    '-frames:v', '1',
    '-q:v', '2',
    '-y',
    outputPath,
  ])
  return outputPath
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/ffmpeg.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/ffmpeg.ts backend/tests/unit/ffmpeg.test.ts
git commit -m "feat(ffmpeg): add FFmpeg/ffprobe helpers for duration, concat file, and frame extraction"
```

---

### Task 18: Render Service

**Files:**
- Create: `backend/src/services/render.service.ts`
- Test: `backend/tests/unit/render.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/render.service.test.ts`:
```typescript
import path from 'path'
import * as ffmpegLib from '../../src/lib/ffmpeg'
import { renderVideo } from '../../src/services/render.service'
import type { AssetRecord, SceneBlock } from '../../src/types'

jest.mock('../../src/lib/ffmpeg')
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg: any = jest.fn(() => ({
    input: jest.fn().mockReturnThis(),
    inputOptions: jest.fn().mockReturnThis(),
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (event: string, cb: any) {
      if (event === 'end') setTimeout(cb, 0)
      return this
    }),
    run: jest.fn(),
  }))
  return mockFfmpeg
})

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const mockGetAudioDurationMs = ffmpegLib.getAudioDurationMs as jest.MockedFunction<
  typeof ffmpegLib.getAudioDurationMs
>
const mockBuildConcatFile = ffmpegLib.buildConcatFile as jest.MockedFunction<
  typeof ffmpegLib.buildConcatFile
>

const MOCK_ASSETS: AssetRecord[] = [
  { sceneId: 1, type: 'image', url: 'https://example.com/1.jpg', localPath: '/tmp/scene_1.jpg', width: 1080, height: 1920 },
  { sceneId: 2, type: 'image', url: 'https://example.com/2.jpg', localPath: '/tmp/scene_2.jpg', width: 1080, height: 1920 },
]

const MOCK_SCENES: SceneBlock[] = [
  { sceneId: 1, description: 'Abertura', narration: 'Texto da cena um.' },
  { sceneId: 2, description: 'Cena dois', narration: 'Texto da cena dois.' },
]

describe('renderVideo', () => {
  it('calls getAudioDurationMs and returns output path', async () => {
    mockGetAudioDurationMs.mockResolvedValueOnce(50000)
    mockBuildConcatFile.mockReturnValueOnce("file '/tmp/scene_1.jpg'\nduration 25")

    const result = await renderVideo({
      generationId: 'gen1',
      storagePath: '/tmp',
      assets: MOCK_ASSETS,
      scenes: MOCK_SCENES,
      ttsPath: '/tmp/narration.wav',
      subtitlePath: '/tmp/subtitles.srt',
      videoType: 'short',
    })

    expect(mockGetAudioDurationMs).toHaveBeenCalledWith('/tmp/narration.wav')
    expect(result).toContain('video.mp4')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/render.service.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/services/render.service.ts`**

```typescript
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { getAudioDurationMs, buildConcatFile } from '../lib/ffmpeg'
import { ensureDir } from './asset-download.service'
import type { AssetRecord, SceneBlock, VideoType } from '../types'

interface RenderOptions {
  generationId: string
  storagePath: string
  assets: AssetRecord[]
  scenes: SceneBlock[]
  ttsPath: string
  subtitlePath: string
  videoType: VideoType
}

const RESOLUTIONS: Record<VideoType, { width: number; height: number }> = {
  short: { width: 1080, height: 1920 },
  long: { width: 1920, height: 1080 },
}

export async function renderVideo(opts: RenderOptions): Promise<string> {
  const { generationId, storagePath, assets, scenes, ttsPath, subtitlePath, videoType } = opts

  const outputDir = path.join(storagePath, 'output', generationId)
  ensureDir(outputDir)
  const tempDir = path.join(storagePath, 'temp', generationId)
  ensureDir(tempDir)

  const audioMs = await getAudioDurationMs(ttsPath)
  const { width, height } = RESOLUTIONS[videoType]
  const durationPerScene = Math.floor(audioMs / scenes.length)

  const imagePaths = assets.map((a) => a.localPath)
  const concatContent = buildConcatFile(imagePaths, durationPerScene)
  const concatPath = path.join(tempDir, 'concat.txt')
  fs.writeFileSync(concatPath, concatContent, 'utf-8')

  const outputPath = path.join(outputDir, 'video.mp4')

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .input(ttsPath)
      .outputOptions([
        `-vf`, `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},subtitles='${subtitlePath.replace(/\\/g, '/')}'`,
        `-c:v`, `libx264`,
        `-c:a`, `aac`,
        `-shortest`,
        `-y`,
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run()
  })
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/render.service.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/render.service.ts backend/tests/unit/render.service.test.ts
git commit -m "feat(render-service): compose final video with FFmpeg using concat + TTS + subtitles"
```

---

### Task 19: Thumbnail Service

**Files:**
- Create: `backend/src/services/thumbnail.service.ts`
- Test: `backend/tests/unit/thumbnail.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/thumbnail.service.test.ts`:
```typescript
import * as ffmpegLib from '../../src/lib/ffmpeg'
import { generateThumbnails } from '../../src/services/thumbnail.service'

jest.mock('../../src/lib/ffmpeg')
process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const mockGetAudioDurationMs = ffmpegLib.getAudioDurationMs as jest.MockedFunction<
  typeof ffmpegLib.getAudioDurationMs
>
const mockExtractFrame = ffmpegLib.extractFrame as jest.MockedFunction<
  typeof ffmpegLib.extractFrame
>

describe('generateThumbnails', () => {
  it('extracts 3 frames at 10%, 50%, 90% of duration', async () => {
    mockGetAudioDurationMs.mockResolvedValueOnce(60000) // 60s
    mockExtractFrame
      .mockResolvedValueOnce('/tmp/thumb1.jpg')
      .mockResolvedValueOnce('/tmp/thumb2.jpg')
      .mockResolvedValueOnce('/tmp/thumb3.jpg')

    const result = await generateThumbnails('gen1', '/tmp', '/tmp/video.mp4')

    expect(mockExtractFrame).toHaveBeenCalledTimes(3)
    // 10% of 60s = 6s
    expect(mockExtractFrame.mock.calls[0][2]).toBeCloseTo(6, 0)
    // 50% = 30s
    expect(mockExtractFrame.mock.calls[1][2]).toBeCloseTo(30, 0)
    // 90% = 54s
    expect(mockExtractFrame.mock.calls[2][2]).toBeCloseTo(54, 0)

    expect(result).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/thumbnail.service.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/services/thumbnail.service.ts`**

```typescript
import path from 'path'
import { getAudioDurationMs, extractFrame } from '../lib/ffmpeg'
import { ensureDir } from './asset-download.service'

const THUMBNAIL_POSITIONS = [0.1, 0.5, 0.9]

export async function generateThumbnails(
  generationId: string,
  storagePath: string,
  videoPath: string,
): Promise<string[]> {
  const outputDir = path.join(storagePath, 'output', generationId)
  ensureDir(outputDir)

  const durationMs = await getAudioDurationMs(videoPath)
  const durationSecs = durationMs / 1000

  const thumbnails: string[] = []

  for (let i = 0; i < THUMBNAIL_POSITIONS.length; i++) {
    const seekSecs = Math.floor(durationSecs * THUMBNAIL_POSITIONS[i])
    const outputPath = path.join(outputDir, `thumb${i + 1}.jpg`)
    await extractFrame(videoPath, outputPath, seekSecs)
    thumbnails.push(outputPath)
  }

  return thumbnails
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/thumbnail.service.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/thumbnail.service.ts backend/tests/unit/thumbnail.service.test.ts
git commit -m "feat(thumbnail-service): extract 3 thumbnail frames from final video"
```

---

### Task 20: SSE Helper

**Files:**
- Create: `backend/src/lib/sse.ts`
- Test: `backend/tests/unit/sse.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/sse.test.ts`:
```typescript
import { createSSEEmitter, sseHeaders } from '../../src/lib/sse'
import type { ProgressEvent } from '../../src/types'

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

describe('sseHeaders', () => {
  it('contains required SSE headers', () => {
    expect(sseHeaders['Content-Type']).toBe('text/event-stream')
    expect(sseHeaders['Cache-Control']).toBe('no-cache')
    expect(sseHeaders['Connection']).toBe('keep-alive')
  })
})

describe('createSSEEmitter', () => {
  it('writes correctly formatted SSE data to res', () => {
    const written: string[] = []
    const mockRes = { write: (data: string) => written.push(data) }

    const emit = createSSEEmitter(mockRes as any)
    const event: ProgressEvent = {
      step: 'script',
      status: 'processing',
      progress: 15,
      message: 'Gerando roteiro...',
    }

    emit(event)

    expect(written).toHaveLength(1)
    expect(written[0]).toMatch(/^data: /)
    expect(written[0]).toContain('"step":"script"')
    expect(written[0]).toContain('"progress":15')
    expect(written[0]).toEndWith('\n\n')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/sse.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/lib/sse.ts`**

```typescript
import type { Response } from 'express'
import type { EmitFn, ProgressEvent } from '../types'

export const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
}

export function createSSEEmitter(res: Response): EmitFn {
  return (event: ProgressEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
    // flush if available (e.g. compression middleware)
    if (typeof (res as any).flush === 'function') {
      (res as any).flush()
    }
  }
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/sse.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/sse.ts backend/tests/unit/sse.test.ts
git commit -m "feat(sse): add Server-Sent Events emitter helper with progress event serialization"
```

---

### Task 21: Pipeline Orchestrator

**Files:**
- Create: `backend/src/services/pipeline.service.ts`
- Test: `backend/tests/unit/pipeline.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/pipeline.service.test.ts`:
```typescript
import { runPipeline } from '../../src/services/pipeline.service'
import * as titleSvc from '../../src/services/title.service'
import * as scriptSvc from '../../src/services/script.service'
import * as assetSearchSvc from '../../src/services/asset-search.service'
import * as assetDownloadSvc from '../../src/services/asset-download.service'
import * as ttsSvc from '../../src/services/tts.service'
import * as subtitleSvc from '../../src/services/subtitle.service'
import * as renderSvc from '../../src/services/render.service'
import * as thumbnailSvc from '../../src/services/thumbnail.service'
import * as tagsSvc from '../../src/services/tags.service'
import * as descSvc from '../../src/services/description.service'
import type { ProgressEvent, SceneBlock, AssetRecord } from '../../src/types'

jest.mock('../../src/services/title.service')
jest.mock('../../src/services/script.service')
jest.mock('../../src/services/asset-search.service')
jest.mock('../../src/services/asset-download.service')
jest.mock('../../src/services/tts.service')
jest.mock('../../src/services/subtitle.service')
jest.mock('../../src/services/render.service')
jest.mock('../../src/services/thumbnail.service')
jest.mock('../../src/services/tags.service')
jest.mock('../../src/services/description.service')

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const MOCK_SCENES: SceneBlock[] = [
  { sceneId: 1, description: 'Abertura', narration: 'Zeus governava o olimpo.' },
]

const MOCK_ASSETS: AssetRecord[] = [
  { sceneId: 1, type: 'image', url: 'https://example.com/1.jpg', localPath: '/tmp/scene_1.jpg', width: 1080, height: 1920 },
]

;(scriptSvc.generateScript as jest.Mock).mockResolvedValue(MOCK_SCENES)
;(assetSearchSvc.searchImages as jest.Mock).mockResolvedValue({ url: 'https://example.com/1.jpg', width: 1080, height: 1920 })
;(assetSearchSvc.searchVideos as jest.Mock).mockResolvedValue(null)
;(assetDownloadSvc.downloadAsset as jest.Mock).mockResolvedValue(undefined)
;(assetDownloadSvc.ensureDir as jest.Mock).mockReturnValue(undefined)
;(ttsSvc.synthesizeSpeech as jest.Mock).mockResolvedValue('/tmp/narration.wav')
;(subtitleSvc.generateSubtitles as jest.Mock).mockResolvedValue('/tmp/subtitles.srt')
;(renderSvc.renderVideo as jest.Mock).mockResolvedValue('/tmp/video.mp4')
;(thumbnailSvc.generateThumbnails as jest.Mock).mockResolvedValue(['/tmp/thumb1.jpg', '/tmp/thumb2.jpg', '/tmp/thumb3.jpg'])
;(tagsSvc.generateTags as jest.Mock).mockResolvedValue(['Zeus', 'mitologia'])
;(descSvc.generateDescription as jest.Mock).mockResolvedValue('Descrição do vídeo.')

describe('runPipeline', () => {
  it('emits progress events in order and returns result', async () => {
    const events: ProgressEvent[] = []
    const emit = (e: ProgressEvent) => events.push(e)

    const result = await runPipeline({
      generationId: 'gen1',
      theme: 'Zeus',
      videoType: 'short',
      selectedTitle: 'Zeus: O Rei dos Deuses',
      storagePath: '/tmp',
      emit,
    })

    const steps = events.map((e) => e.step)
    expect(steps).toContain('script')
    expect(steps).toContain('tts')
    expect(steps).toContain('render')
    expect(steps).toContain('completed')

    expect(result.videoPath).toBe('/tmp/video.mp4')
    expect(result.tags).toContain('Zeus')
  })

  it('emits error event when a service throws', async () => {
    ;(scriptSvc.generateScript as jest.Mock).mockRejectedValueOnce(
      new Error('LLM failed')
    )
    const events: ProgressEvent[] = []
    await expect(
      runPipeline({
        generationId: 'gen2',
        theme: 'Zeus',
        videoType: 'short',
        selectedTitle: 'Título',
        storagePath: '/tmp',
        emit: (e) => events.push(e),
      })
    ).rejects.toThrow('LLM failed')

    const errorEvent = events.find((e) => e.status === 'error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.step).toBe('script')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/pipeline.service.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/services/pipeline.service.ts`**

```typescript
import path from 'path'
import { generateScript } from './script.service'
import { searchImages, searchVideos } from './asset-search.service'
import { downloadAsset, ensureDir } from './asset-download.service'
import { buildNarrationText, synthesizeSpeech } from './tts.service'
import { generateSubtitles } from './subtitle.service'
import { renderVideo } from './render.service'
import { generateThumbnails } from './thumbnail.service'
import { generateTags } from './tags.service'
import { generateDescription } from './description.service'
import type { AssetRecord, EmitFn, GenerationResult, PipelineStep, VideoType } from '../types'

interface PipelineInput {
  generationId: string
  theme: string
  videoType: VideoType
  selectedTitle: string
  storagePath: string
  emit: EmitFn
}

function progress(emit: EmitFn, step: PipelineStep, pct: number, msg: string) {
  emit({ step, status: 'processing', progress: pct, message: msg })
}

function done(emit: EmitFn, step: PipelineStep, pct: number) {
  emit({ step, status: 'done', progress: pct })
}

async function withEmit<T>(
  emit: EmitFn,
  step: PipelineStep,
  startPct: number,
  endPct: number,
  message: string,
  fn: () => Promise<T>,
): Promise<T> {
  progress(emit, step, startPct, message)
  try {
    const result = await fn()
    done(emit, step, endPct)
    return result
  } catch (err) {
    emit({ step, status: 'error', progress: startPct, error: (err as Error).message })
    throw err
  }
}

export async function runPipeline(input: PipelineInput): Promise<GenerationResult> {
  const { generationId, theme, videoType, selectedTitle, storagePath, emit } = input

  const orientation = videoType === 'short' ? 'portrait' : 'landscape'

  // Step 1: Generate script
  const scenes = await withEmit(emit, 'script', 10, 20, 'Gerando roteiro...', () =>
    generateScript(theme, videoType, selectedTitle),
  )

  // Step 2: Search images
  const assetSearchResults = await withEmit(emit, 'images', 20, 30, 'Buscando imagens...', async () => {
    return Promise.all(
      scenes.map((scene) => searchImages(scene.description, orientation)),
    )
  })

  // Step 3: Search videos (optional overlay)
  const videoSearchResults = await withEmit(emit, 'videos', 30, 38, 'Buscando vídeos...', async () => {
    return Promise.all(scenes.map((scene) => searchVideos(scene.description)))
  })

  // Step 4: Download assets
  const assets: AssetRecord[] = await withEmit(emit, 'images', 38, 42, 'Baixando assets...', async () => {
    const assetsDir = path.join(storagePath, 'temp', generationId, 'assets')
    ensureDir(assetsDir)
    const records: AssetRecord[] = []

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const videoResult = videoSearchResults[i]
      const imageResult = assetSearchResults[i]

      const source = videoResult ?? imageResult
      if (!source) continue

      const type = videoResult ? 'video' : 'image'
      const ext = type === 'video' ? 'mp4' : 'jpg'
      const localPath = path.join(assetsDir, `scene_${scene.sceneId}.${ext}`)

      await downloadAsset(source.url, localPath)
      records.push({
        sceneId: scene.sceneId,
        type,
        url: source.url,
        localPath,
        width: source.width,
        height: source.height,
      })
    }

    return records
  })

  // Step 5: TTS narration
  const narrationText = buildNarrationText(scenes)
  const ttsPath = await withEmit(emit, 'tts', 42, 55, 'Gerando narração...', () =>
    synthesizeSpeech(narrationText, generationId, storagePath),
  )

  // Step 6: Subtitles
  const subtitlePath = await withEmit(emit, 'subtitles', 55, 60, 'Gerando legendas...', () =>
    generateSubtitles(scenes, generationId, storagePath, 50000),
  )

  // Step 7: Render video
  const videoPath = await withEmit(emit, 'render', 60, 80, 'Renderizando vídeo...', () =>
    renderVideo({ generationId, storagePath, assets, scenes, ttsPath, subtitlePath, videoType }),
  )

  // Step 8: Thumbnails
  const thumbnails = await withEmit(emit, 'thumbnails', 80, 88, 'Gerando thumbnails...', () =>
    generateThumbnails(generationId, storagePath, videoPath),
  )

  // Step 9: Tags
  const scriptText = scenes.map((s) => s.narration).join(' ')
  const tags = await withEmit(emit, 'tags', 88, 93, 'Gerando tags...', () =>
    generateTags(scriptText),
  )

  // Step 10: Description
  const description = await withEmit(emit, 'description', 93, 97, 'Gerando descrição...', () =>
    generateDescription(scriptText),
  )

  emit({ step: 'completed', status: 'done', progress: 100, message: 'Vídeo gerado com sucesso!' })

  return {
    generationId,
    title: selectedTitle,
    videoPath,
    thumbnails,
    script: scenes,
    tags,
    description,
  }
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/pipeline.service.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pipeline.service.ts backend/tests/unit/pipeline.service.test.ts
git commit -m "feat(pipeline): orchestrate full generation pipeline with SSE progress emission"
```

---

### Task 22: Generation Routes

**Files:**
- Create: `backend/src/routes/generation.ts`
- Create: `backend/src/routes/history.ts`
- Create: `backend/src/routes/logs.ts`
- Test: `backend/tests/integration/generation.route.test.ts`

- [ ] **Step 1: Write failing integration test**

Create `backend/tests/integration/generation.route.test.ts`:
```typescript
import request from 'supertest'
import { createApp } from '../../src/server'
import * as titleSvc from '../../src/services/title.service'
import * as pipelineSvc from '../../src/services/pipeline.service'

jest.mock('../../src/services/title.service')
jest.mock('../../src/services/pipeline.service')

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'
process.env.DATABASE_URL = ':memory:'

const mockGenerateTitles = titleSvc.generateTitles as jest.MockedFunction<typeof titleSvc.generateTitles>

describe('POST /api/generation/start', () => {
  it('returns 400 if theme is missing', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/generation/start')
      .send({ videoType: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/theme/)
  })

  it('returns 400 if videoType is invalid', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/generation/start')
      .send({ theme: 'Zeus', videoType: 'medium' })

    expect(res.status).toBe(400)
  })

  it('returns generationId on valid request', async () => {
    mockGenerateTitles.mockResolvedValueOnce(['Title A', 'Title B', 'Title C'])
    const app = createApp()
    const res = await request(app)
      .post('/api/generation/start')
      .send({ theme: 'Zeus', videoType: 'short' })

    expect(res.status).toBe(200)
    expect(res.body.generationId).toBeDefined()
    expect(res.body.titles).toHaveLength(3)
  })
})

describe('POST /api/generation/:id/select-title', () => {
  it('returns 404 for unknown generation id', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/generation/nonexistent-id/select-title')
      .send({ titleIndex: 0 })

    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/integration/generation.route.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/routes/generation.ts`**

```typescript
import { Router, Request, Response } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db } from '../db'
import { generations } from '../db/schema'
import { generateTitles } from '../services/title.service'
import { runPipeline } from '../services/pipeline.service'
import { createSSEEmitter, sseHeaders } from '../lib/sse'
import { logger } from '../lib/logger'
import { eq } from 'drizzle-orm'
import { config } from '../config'
import type { VideoType } from '../types'

const startSchema = z.object({
  theme: z.string().min(1, 'theme is required'),
  videoType: z.enum(['short', 'long']),
})

const selectTitleSchema = z.object({
  titleIndex: z.number().int().min(0).max(2),
})

export const generationRouter = Router()

generationRouter.post('/start', async (req: Request, res: Response) => {
  const parsed = startSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  }

  const { theme, videoType } = parsed.data
  const generationId = nanoid()
  const now = Date.now()

  try {
    const titles = await generateTitles(theme, videoType as VideoType)

    await db.insert(generations).values({
      id: generationId,
      theme,
      videoType,
      suggestedTitles: JSON.stringify(titles),
      status: 'pending_title_selection',
      createdAt: now,
      updatedAt: now,
    })

    return res.json({ generationId, titles })
  } catch (err) {
    logger.error({ err }, 'failed to generate titles')
    return res.status(500).json({ error: (err as Error).message })
  }
})

generationRouter.post('/:id/select-title', async (req: Request, res: Response) => {
  const { id } = req.params
  const parsed = selectTitleSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  }

  const generation = await db.query.generations.findFirst({
    where: eq(generations.id, id),
  })

  if (!generation) {
    return res.status(404).json({ error: 'Generation not found' })
  }

  const titles: string[] = JSON.parse(generation.suggestedTitles ?? '[]')
  const selectedTitle = titles[parsed.data.titleIndex]

  if (!selectedTitle) {
    return res.status(400).json({ error: 'Invalid title index' })
  }

  await db.update(generations)
    .set({ selectedTitle, status: 'processing', updatedAt: Date.now() })
    .where(eq(generations.id, id))

  return res.json({ generationId: id, selectedTitle })
})

generationRouter.get('/:id/stream', async (req: Request, res: Response) => {
  const { id } = req.params

  const generation = await db.query.generations.findFirst({
    where: eq(generations.id, id),
  })

  if (!generation || !generation.selectedTitle) {
    return res.status(404).json({ error: 'Generation not found or title not selected' })
  }

  res.writeHead(200, sseHeaders)

  const emit = createSSEEmitter(res)

  try {
    const result = await runPipeline({
      generationId: id,
      theme: generation.theme,
      videoType: generation.videoType as VideoType,
      selectedTitle: generation.selectedTitle,
      storagePath: config.STORAGE_PATH,
      emit,
    })

    await db.update(generations).set({
      script: JSON.stringify(result.script),
      videoPath: result.videoPath,
      thumbnailsJson: JSON.stringify(result.thumbnails),
      tags: JSON.stringify(result.tags),
      description: result.description,
      status: 'completed',
      updatedAt: Date.now(),
    }).where(eq(generations.id, id))

    emit({ step: 'saving', status: 'done', progress: 100 })
  } catch (err) {
    logger.error({ err, generationId: id }, 'pipeline failed')
    await db.update(generations).set({
      status: 'failed',
      error: (err as Error).message,
      updatedAt: Date.now(),
    }).where(eq(generations.id, id))
  } finally {
    res.end()
  }
})
```

- [ ] **Step 4: Create `backend/src/routes/history.ts`**

```typescript
import { Router, Request, Response } from 'express'
import { db } from '../db'
import { generations } from '../db/schema'
import { desc, eq } from 'drizzle-orm'

export const historyRouter = Router()

historyRouter.get('/', async (_req: Request, res: Response) => {
  const records = await db.select().from(generations).orderBy(desc(generations.createdAt)).limit(50)
  return res.json(records)
})

historyRouter.get('/:id', async (req: Request, res: Response) => {
  const record = await db.query.generations.findFirst({
    where: eq(generations.id, req.params.id),
  })
  if (!record) return res.status(404).json({ error: 'Not found' })
  return res.json(record)
})
```

- [ ] **Step 5: Create `backend/src/routes/logs.ts`**

```typescript
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { logs } from '../db/schema'
import { desc } from 'drizzle-orm'

export const logsRouter = Router()

logsRouter.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500)
  const records = await db.select().from(logs).orderBy(desc(logs.createdAt)).limit(limit)
  return res.json(records)
})

const logSchema = z.object({
  level: z.enum(['info', 'warn', 'error', 'debug']),
  message: z.string().min(1),
  context: z.record(z.unknown()).optional(),
})

logsRouter.post('/', async (req: Request, res: Response) => {
  const parsed = logSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { level, message, context } = parsed.data
  await db.insert(logs).values({
    level,
    message,
    source: 'frontend',
    contextJson: context ? JSON.stringify(context) : null,
    createdAt: Date.now(),
  })

  return res.status(201).json({ ok: true })
})
```

- [ ] **Step 6: Run test**

```bash
cd backend && pnpm test tests/integration/generation.route.test.ts
```
Expected: PASS

- [ ] **Step 7: Run all backend tests**

```bash
cd backend && pnpm test
```
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add backend/src/routes/
git commit -m "feat(routes): add generation, history, and logs API routes"
```

---

### Task 23: Tailwind + Design Tokens Setup

**Files:**
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/src/styles/globals.css`
- Create: `frontend/src/styles/design-tokens.css`

- [ ] **Step 1: Write failing test for token existence**

Create `frontend/__tests__/styles/tokens.test.ts`:
```typescript
import fs from 'fs'
import path from 'path'

describe('design tokens', () => {
  const tokensPath = path.join(__dirname, '../../src/styles/design-tokens.css')

  it('design-tokens.css file exists', () => {
    expect(fs.existsSync(tokensPath)).toBe(true)
  })

  it('contains kraken purple token', () => {
    const content = fs.readFileSync(tokensPath, 'utf-8')
    expect(content).toContain('#7132f5')
  })

  it('contains near-black token', () => {
    const content = fs.readFileSync(tokensPath, 'utf-8')
    expect(content).toContain('#101114')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test __tests__/styles/tokens.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `frontend/src/styles/design-tokens.css`**

```css
:root {
  /* Brand colors */
  --color-brand: #7132f5;
  --color-brand-dark: #5741d8;
  --color-brand-deep: #5b1ecf;
  --color-brand-subtle: rgba(133, 91, 251, 0.16);

  /* Neutral */
  --color-near-black: #101114;
  --color-cool-gray: #686b82;
  --color-silver-blue: #9497a9;
  --color-white: #ffffff;
  --color-border-gray: #dedee5;
  --color-border-subtle: rgba(104, 107, 130, 0.24);

  /* Semantic */
  --color-success: #149e61;
  --color-success-bg: rgba(20, 158, 97, 0.16);
  --color-success-text: #026b3f;

  /* Typography */
  --font-display: 'IBM Plex Sans', Helvetica, Arial, sans-serif;
  --font-ui: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;

  /* Shadows */
  --shadow-subtle: rgba(0, 0, 0, 0.03) 0px 4px 24px;
  --shadow-micro: rgba(16, 24, 40, 0.04) 0px 1px 4px;

  /* Radius */
  --radius-button: 12px;
  --radius-badge: 8px;
  --radius-card: 16px;
}
```

- [ ] **Step 4: Create `frontend/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: '#7132f5',
        'brand-dark': '#5741d8',
        'brand-deep': '#5b1ecf',
        'near-black': '#101114',
        'cool-gray': '#686b82',
        'silver-blue': '#9497a9',
        'border-gray': '#dedee5',
        success: '#149e61',
      },
      fontFamily: {
        ui: ['var(--font-ui)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['var(--font-ui)', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        button: '12px',
        badge: '8px',
        card: '16px',
      },
      boxShadow: {
        subtle: 'rgba(0,0,0,0.03) 0px 4px 24px',
        micro: 'rgba(16,24,40,0.04) 0px 1px 4px',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Create `frontend/src/styles/globals.css`**

```css
@import './design-tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    color: var(--color-near-black);
    background: var(--color-white);
    font-family: var(--font-ui);
  }

  h1, h2, h3 {
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: -0.5px;
  }
}
```

- [ ] **Step 6: Run test**

```bash
cd frontend && pnpm test __tests__/styles/tokens.test.ts
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/tailwind.config.ts frontend/src/styles/
git commit -m "feat(design-system): add Kraken-inspired design tokens and Tailwind config"
```

---

*Continue to `PLAN_1_PART_5.md` for Tasks 24–31: Frontend UI Components.*
