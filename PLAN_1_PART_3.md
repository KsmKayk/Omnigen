# Omnigen — Tasks 9–16: Generation Pipeline Services (Title → Subtitle)

> **Prerequisite:** Tasks 1–8 from `PLAN_1_PART_2.md` must be complete.

---

### Task 9: Template Loader Utility

**Files:**
- Create: `backend/src/lib/template-loader.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/template-loader.test.ts`:
```typescript
import path from 'path'
import fs from 'fs'
import { loadTemplate } from '../../src/lib/template-loader'

describe('loadTemplate', () => {
  const tmpFile = path.join(__dirname, 'test_template.txt')

  beforeAll(() => {
    fs.writeFileSync(tmpFile, 'Hello {{name}}, your type is {{type}}.')
  })

  afterAll(() => {
    fs.unlinkSync(tmpFile)
  })

  it('fills all placeholders', () => {
    const fill = loadTemplate(tmpFile)
    const result = fill({ name: 'Zeus', type: 'short' })
    expect(result).toBe('Hello Zeus, your type is short.')
  })

  it('throws if template file does not exist', () => {
    expect(() => loadTemplate('/nonexistent/path.txt')).toThrow()
  })

  it('leaves unreplaced placeholders when key is missing', () => {
    const fill = loadTemplate(tmpFile)
    const result = fill({ name: 'Zeus' })
    expect(result).toContain('{{type}}')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/template-loader.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/lib/template-loader.ts`**

```typescript
import fs from 'fs'

export function loadTemplate(filePath: string): (vars: Record<string, string>) => string {
  const content = fs.readFileSync(filePath, 'utf-8')

  return (vars: Record<string, string>): string => {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
  }
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/template-loader.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/template-loader.ts
git commit -m "feat(template-loader): add template file loader with placeholder substitution"
```

---

### Task 10: Title Service

**Files:**
- Create: `backend/src/services/title.service.ts`
- Test: `backend/tests/unit/title.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/title.service.test.ts`:
```typescript
import { generateTitles } from '../../src/services/title.service'
import * as openrouter from '../../src/lib/openrouter'

jest.mock('../../src/lib/openrouter')

const mockCallLLM = openrouter.callLLM as jest.MockedFunction<typeof openrouter.callLLM>

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

describe('generateTitles', () => {
  it('returns exactly 3 titles from LLM response', async () => {
    mockCallLLM.mockResolvedValueOnce(
      'A Queda dos Deuses\nZeus: O Senhor dos Trovões\nO Mito da Criação'
    )
    const titles = await generateTitles('Zeus', 'short')
    expect(titles).toHaveLength(3)
    expect(titles[0]).toBe('A Queda dos Deuses')
    expect(titles[2]).toBe('O Mito da Criação')
  })

  it('trims whitespace from each title', async () => {
    mockCallLLM.mockResolvedValueOnce('  Título Um  \n  Título Dois  \n  Título Três  ')
    const titles = await generateTitles('teste', 'long')
    expect(titles[0]).toBe('Título Um')
    expect(titles[1]).toBe('Título Dois')
  })

  it('throws if LLM returns fewer than 3 non-empty lines', async () => {
    mockCallLLM.mockResolvedValueOnce('Apenas um título')
    await expect(generateTitles('teste', 'short')).rejects.toThrow('Expected 3 titles')
  })

  it('passes theme and videoType to LLM prompt', async () => {
    mockCallLLM.mockResolvedValueOnce('T1\nT2\nT3')
    await generateTitles('Cleopatra', 'long')
    const prompt = mockCallLLM.mock.calls[0][0]
    expect(prompt).toContain('Cleopatra')
    expect(prompt).toContain('long')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/title.service.test.ts
```
Expected: FAIL — `Cannot find module '../../src/services/title.service'`

- [ ] **Step 3: Create `backend/src/services/title.service.ts`**

```typescript
import path from 'path'
import { callLLM } from '../lib/openrouter'
import { loadTemplate } from '../lib/template-loader'
import { config } from '../config'
import type { VideoType } from '../types'

const getTemplate = () =>
  loadTemplate(
    path.join(config.PROMPTS_PATH, 'text_templates', 'title_generation_template.txt')
  )

export async function generateTitles(theme: string, videoType: VideoType): Promise<string[]> {
  const fill = getTemplate()
  const prompt = fill({ theme, video_type: videoType })

  const response = await callLLM(prompt)
  const titles = response
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (titles.length < 3) {
    throw new Error(`Expected 3 titles from LLM, got ${titles.length}`)
  }

  return titles.slice(0, 3)
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/title.service.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/title.service.ts backend/tests/unit/title.service.test.ts
git commit -m "feat(title-service): generate 3 title suggestions via OpenRouter"
```

---

### Task 11: Script Service

**Files:**
- Create: `backend/src/services/script.service.ts`
- Test: `backend/tests/unit/script.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/script.service.test.ts`:
```typescript
import { generateScript } from '../../src/services/script.service'
import * as openrouter from '../../src/lib/openrouter'
import type { SceneBlock } from '../../src/types'

jest.mock('../../src/lib/openrouter')
process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const mockCallLLM = openrouter.callLLM as jest.MockedFunction<typeof openrouter.callLLM>

const SAMPLE_SCRIPT = `[CENA 1] Zeus no Monte Olimpo
Na origem dos tempos, Zeus governava o mundo com pulso firme.

[CENA 2] A tempestade
Seus trovões ecoavam por toda a Terra, proclamando seu domínio.

[CENA 3] Os mortais
Os humanos tremiam e ofereciam sacrifícios ao rei dos deuses.`

describe('generateScript', () => {
  it('parses scene blocks from LLM output', async () => {
    mockCallLLM.mockResolvedValueOnce(SAMPLE_SCRIPT)
    const scenes = await generateScript('Zeus', 'short', 'Zeus: O Senhor dos Trovões')
    expect(scenes).toHaveLength(3)
    expect(scenes[0].sceneId).toBe(1)
    expect(scenes[0].description).toBe('Zeus no Monte Olimpo')
    expect(scenes[0].narration).toBe(
      'Na origem dos tempos, Zeus governava o mundo com pulso firme.'
    )
  })

  it('uses short_template.txt for short videos', async () => {
    mockCallLLM.mockResolvedValueOnce(SAMPLE_SCRIPT)
    await generateScript('Zeus', 'short', 'Título')
    const prompt = mockCallLLM.mock.calls[0][0]
    expect(prompt).toContain('45')
  })

  it('uses long_template.txt for long videos', async () => {
    mockCallLLM.mockResolvedValueOnce(SAMPLE_SCRIPT)
    await generateScript('Zeus', 'long', 'Título')
    const prompt = mockCallLLM.mock.calls[0][0]
    expect(prompt).toContain('10')
  })

  it('throws if no scenes could be parsed', async () => {
    mockCallLLM.mockResolvedValueOnce('invalid output without scene markers')
    await expect(generateScript('teste', 'short', 'T')).rejects.toThrow('No scenes parsed')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/script.service.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/services/script.service.ts`**

```typescript
import path from 'path'
import { callLLM } from '../lib/openrouter'
import { loadTemplate } from '../lib/template-loader'
import { config } from '../config'
import type { VideoType, SceneBlock } from '../types'

function getTemplatePath(videoType: VideoType): string {
  const file = videoType === 'short' ? 'short_template.txt' : 'long_template.txt'
  return path.join(config.PROMPTS_PATH, 'text_templates', file)
}

function parseScenes(raw: string): SceneBlock[] {
  const sceneRegex = /\[CENA\s+(\d+)\]\s*(.+)\n([\s\S]*?)(?=\n\[CENA|\s*$)/gi
  const scenes: SceneBlock[] = []
  let match: RegExpExecArray | null

  while ((match = sceneRegex.exec(raw)) !== null) {
    scenes.push({
      sceneId: parseInt(match[1], 10),
      description: match[2].trim(),
      narration: match[3].trim(),
    })
  }

  return scenes
}

export async function generateScript(
  theme: string,
  videoType: VideoType,
  title: string,
): Promise<SceneBlock[]> {
  const fill = loadTemplate(getTemplatePath(videoType))
  const prompt = fill({ title, theme })

  const response = await callLLM(prompt)
  const scenes = parseScenes(response)

  if (scenes.length === 0) {
    throw new Error('No scenes parsed from LLM script output')
  }

  return scenes
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/script.service.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/script.service.ts backend/tests/unit/script.service.test.ts
git commit -m "feat(script-service): generate scene-based script via OpenRouter with template"
```

---

### Task 12: Asset Search Service (Pexels)

**Files:**
- Create: `backend/src/services/asset-search.service.ts`
- Test: `backend/tests/unit/asset-search.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/asset-search.service.test.ts`:
```typescript
import nock from 'nock'
import { searchImages, searchVideos } from '../../src/services/asset-search.service'

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test-pexels-key'

describe('searchImages', () => {
  afterEach(() => nock.cleanAll())

  it('returns image URL and dimensions from Pexels', async () => {
    nock('https://api.pexels.com')
      .get('/v1/search')
      .query({ query: 'Zeus thunder', per_page: '1', orientation: 'portrait' })
      .reply(200, {
        photos: [
          {
            id: 1,
            src: { original: 'https://images.pexels.com/photos/1/photo.jpg' },
            width: 1080,
            height: 1920,
          },
        ],
      })

    const result = await searchImages('Zeus thunder', 'portrait')
    expect(result).not.toBeNull()
    expect(result!.url).toContain('pexels.com')
    expect(result!.width).toBe(1080)
  })

  it('returns null when no photos found', async () => {
    nock('https://api.pexels.com')
      .get('/v1/search')
      .query(true)
      .reply(200, { photos: [] })

    const result = await searchImages('very obscure query xyzabc', 'landscape')
    expect(result).toBeNull()
  })
})

describe('searchVideos', () => {
  afterEach(() => nock.cleanAll())

  it('returns video URL from Pexels', async () => {
    nock('https://api.pexels.com')
      .get('/videos/search')
      .query({ query: 'storm lightning', per_page: '1' })
      .reply(200, {
        videos: [
          {
            id: 2,
            video_files: [
              { link: 'https://videos.pexels.com/video-files/2/video.mp4', width: 1920, height: 1080 },
            ],
          },
        ],
      })

    const result = await searchVideos('storm lightning')
    expect(result).not.toBeNull()
    expect(result!.url).toContain('pexels.com')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/asset-search.service.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/services/asset-search.service.ts`**

```typescript
import https from 'https'
import { config } from '../config'

type Orientation = 'portrait' | 'landscape'

interface AssetSearchResult {
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
            reject(e)
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
  const params = new URLSearchParams({
    query,
    per_page: '1',
    orientation,
  })

  const data = await pexelsFetch<{ photos: { src: { original: string }; width: number; height: number }[] }>(
    `https://api.pexels.com/v1/search?${params}`,
  )

  const photo = data.photos[0]
  if (!photo) return null

  return {
    url: photo.src.original,
    width: photo.width,
    height: photo.height,
  }
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

  return {
    url: file.link,
    width: file.width,
    height: file.height,
  }
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/asset-search.service.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/asset-search.service.ts backend/tests/unit/asset-search.service.test.ts
git commit -m "feat(asset-search): search images and videos from Pexels API"
```

---

### Task 13: Asset Download Service

**Files:**
- Create: `backend/src/services/asset-download.service.ts`
- Test: `backend/tests/unit/asset-download.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/asset-download.service.test.ts`:
```typescript
import fs from 'fs'
import path from 'path'
import nock from 'nock'
import { downloadAsset, ensureDir } from '../../src/services/asset-download.service'

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const TMP = path.join(__dirname, 'tmp_download_test')

describe('downloadAsset', () => {
  beforeAll(() => fs.mkdirSync(TMP, { recursive: true }))
  afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))
  afterEach(() => nock.cleanAll())

  it('downloads file to destination path', async () => {
    nock('https://files.pexels.com')
      .get('/photo.jpg')
      .reply(200, Buffer.from('fake-image-data'), { 'content-type': 'image/jpeg' })

    const dest = path.join(TMP, 'photo.jpg')
    await downloadAsset('https://files.pexels.com/photo.jpg', dest)
    expect(fs.existsSync(dest)).toBe(true)
    expect(fs.readFileSync(dest).toString()).toBe('fake-image-data')
  })

  it('throws on HTTP error status', async () => {
    nock('https://files.pexels.com').get('/missing.jpg').reply(404)
    await expect(
      downloadAsset('https://files.pexels.com/missing.jpg', path.join(TMP, 'x.jpg'))
    ).rejects.toThrow('HTTP 404')
  })
})

describe('ensureDir', () => {
  it('creates nested directories', () => {
    const dir = path.join(TMP, 'a', 'b', 'c')
    ensureDir(dir)
    expect(fs.existsSync(dir)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/asset-download.service.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/services/asset-download.service.ts`**

```typescript
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

    protocol
      .get(url, (res) => {
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
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => {})
        reject(err)
      })
  })
}

export async function downloadSceneAssets(
  generationId: string,
  storageBase: string,
  assets: Array<{ sceneId: number; url: string; type: 'image' | 'video' }>,
): Promise<Array<{ sceneId: number; localPath: string }>> {
  const dir = path.join(storageBase, 'temp', generationId, 'assets')
  ensureDir(dir)

  const results: Array<{ sceneId: number; localPath: string }> = []

  for (const asset of assets) {
    const ext = asset.type === 'video' ? 'mp4' : 'jpg'
    const localPath = path.join(dir, `scene_${asset.sceneId}.${ext}`)
    await downloadAsset(asset.url, localPath)
    results.push({ sceneId: asset.sceneId, localPath })
  }

  return results
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/asset-download.service.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/asset-download.service.ts backend/tests/unit/asset-download.service.test.ts
git commit -m "feat(asset-download): download and store scene assets from URLs"
```

---

### Task 14: TTS Service (Piper)

**Files:**
- Create: `backend/src/lib/piper.ts`
- Create: `backend/src/services/tts.service.ts`
- Test: `backend/tests/unit/tts.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/tts.service.test.ts`:
```typescript
import path from 'path'
import * as piper from '../../src/lib/piper'
import { synthesizeSpeech } from '../../src/services/tts.service'

jest.mock('../../src/lib/piper')
process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const mockRunPiper = piper.runPiper as jest.MockedFunction<typeof piper.runPiper>

describe('synthesizeSpeech', () => {
  it('calls runPiper with correct arguments', async () => {
    mockRunPiper.mockResolvedValueOnce('/tmp/gen1/narration.wav')
    const narrationText = 'Zeus governava o mundo com trovões.'
    const result = await synthesizeSpeech(narrationText, 'gen1', '/tmp')
    expect(mockRunPiper).toHaveBeenCalledWith(
      narrationText,
      expect.stringContaining('narration.wav'),
    )
    expect(result).toContain('narration.wav')
  })

  it('throws if piper execution fails', async () => {
    mockRunPiper.mockRejectedValueOnce(new Error('Piper process failed'))
    await expect(synthesizeSpeech('test', 'gen2', '/tmp')).rejects.toThrow('Piper process failed')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/tts.service.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/lib/piper.ts`**

```typescript
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
    '--',
    text,
  ])

  return outputPath
}
```

- [ ] **Step 4: Create `backend/src/services/tts.service.ts`**

```typescript
import path from 'path'
import { runPiper } from '../lib/piper'
import { ensureDir } from './asset-download.service'
import type { SceneBlock } from '../types'

export function buildNarrationText(scenes: SceneBlock[]): string {
  return scenes.map((s) => s.narration).join(' ')
}

export async function synthesizeSpeech(
  narrationText: string,
  generationId: string,
  storagePath: string,
): Promise<string> {
  const dir = path.join(storagePath, 'temp', generationId)
  ensureDir(dir)

  const outputPath = path.join(dir, 'narration.wav')
  await runPiper(narrationText, outputPath)

  return outputPath
}
```

- [ ] **Step 5: Run test**

```bash
cd backend && pnpm test tests/unit/tts.service.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/piper.ts backend/src/services/tts.service.ts backend/tests/unit/tts.service.test.ts
git commit -m "feat(tts-service): synthesize speech from script narration using Piper TTS"
```

---

### Task 15: Subtitle Service

**Files:**
- Create: `backend/src/services/subtitle.service.ts`
- Test: `backend/tests/unit/subtitle.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/subtitle.service.test.ts`:
```typescript
import fs from 'fs'
import path from 'path'
import { generateSubtitles, formatSRTTime } from '../../src/services/subtitle.service'
import type { SceneBlock } from '../../src/types'

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const TMP = path.join(__dirname, 'tmp_subtitle_test')

const SCENES: SceneBlock[] = [
  { sceneId: 1, description: 'Abertura', narration: 'Zeus governava o mundo.' },
  { sceneId: 2, description: 'Conflito', narration: 'Os titãs se rebelaram contra os deuses.' },
]

describe('formatSRTTime', () => {
  it('formats milliseconds to SRT timestamp', () => {
    expect(formatSRTTime(0)).toBe('00:00:00,000')
    expect(formatSRTTime(1500)).toBe('00:00:01,500')
    expect(formatSRTTime(61000)).toBe('00:01:01,000')
    expect(formatSRTTime(3661000)).toBe('01:01:01,000')
  })
})

describe('generateSubtitles', () => {
  beforeAll(() => fs.mkdirSync(TMP, { recursive: true }))
  afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

  it('generates a valid .srt file', async () => {
    const srtPath = await generateSubtitles(SCENES, 'gen1', TMP, 10000)
    expect(fs.existsSync(srtPath)).toBe(true)

    const content = fs.readFileSync(srtPath, 'utf-8')
    expect(content).toContain('Zeus governava o mundo.')
    expect(content).toContain('Os titãs se rebelaram')
    expect(content).toMatch(/\d+\r?\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/)
  })

  it('distributes duration proportionally by word count', async () => {
    const srtPath = await generateSubtitles(SCENES, 'gen2', TMP, 10000)
    const content = fs.readFileSync(srtPath, 'utf-8')
    // scene 2 has more words, should end later
    expect(content).toContain('00:00:00,000 --> ')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/subtitle.service.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/services/subtitle.service.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import { ensureDir } from './asset-download.service'
import type { SceneBlock } from '../types'

export function formatSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1_000)
  const millis = ms % 1_000

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':') + `,${String(millis).padStart(3, '0')}`
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

function buildSRT(scenes: SceneBlock[], totalDurationMs: number): string {
  const totalWords = scenes.reduce((sum, s) => sum + countWords(s.narration), 0)
  const blocks: string[] = []

  let cursor = 0

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    const words = countWords(scene.narration)
    const duration = Math.round((words / totalWords) * totalDurationMs)
    const start = cursor
    const end = cursor + duration

    blocks.push(
      [
        String(i + 1),
        `${formatSRTTime(start)} --> ${formatSRTTime(end)}`,
        scene.narration,
        '',
      ].join('\n'),
    )

    cursor = end
  }

  return blocks.join('\n')
}

export async function generateSubtitles(
  scenes: SceneBlock[],
  generationId: string,
  storagePath: string,
  totalDurationMs: number,
): Promise<string> {
  const dir = path.join(storagePath, 'temp', generationId)
  ensureDir(dir)

  const srtContent = buildSRT(scenes, totalDurationMs)
  const srtPath = path.join(dir, 'subtitles.srt')
  fs.writeFileSync(srtPath, srtContent, 'utf-8')

  return srtPath
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/subtitle.service.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/subtitle.service.ts backend/tests/unit/subtitle.service.test.ts
git commit -m "feat(subtitle-service): generate SRT subtitles with proportional timing from script"
```

---

### Task 16: Tags and Description Services

**Files:**
- Create: `backend/src/services/tags.service.ts`
- Create: `backend/src/services/description.service.ts`
- Test: `backend/tests/unit/tags.service.test.ts`
- Test: `backend/tests/unit/description.service.test.ts`

- [ ] **Step 1: Write failing tests for tags**

Create `backend/tests/unit/tags.service.test.ts`:
```typescript
import { generateTags } from '../../src/services/tags.service'
import * as openrouter from '../../src/lib/openrouter'

jest.mock('../../src/lib/openrouter')
process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const mockCallLLM = openrouter.callLLM as jest.MockedFunction<typeof openrouter.callLLM>

describe('generateTags', () => {
  it('parses comma-separated tags', async () => {
    mockCallLLM.mockResolvedValueOnce('Zeus, mitologia, deuses gregos, Olimpo, trovões, poder, história, lenda, Grécia, titãs')
    const tags = await generateTags('Zeus governava o mundo.')
    expect(tags).toHaveLength(10)
    expect(tags[0]).toBe('Zeus')
    expect(tags[9]).toBe('titãs')
  })

  it('trims whitespace from each tag', async () => {
    mockCallLLM.mockResolvedValueOnce(' tag1 , tag2 , tag3 , tag4 , tag5 , tag6 , tag7 , tag8 , tag9 , tag10 ')
    const tags = await generateTags('script text')
    expect(tags[0]).toBe('tag1')
    expect(tags[9]).toBe('tag10')
  })
})
```

Create `backend/tests/unit/description.service.test.ts`:
```typescript
import { generateDescription } from '../../src/services/description.service'
import * as openrouter from '../../src/lib/openrouter'

jest.mock('../../src/lib/openrouter')
process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const mockCallLLM = openrouter.callLLM as jest.MockedFunction<typeof openrouter.callLLM>

describe('generateDescription', () => {
  it('returns the LLM response as description string', async () => {
    mockCallLLM.mockResolvedValueOnce('Descubra os segredos de Zeus, o poderoso rei dos deuses do Olimpo.')
    const result = await generateDescription('script content here')
    expect(result).toBe('Descubra os segredos de Zeus, o poderoso rei dos deuses do Olimpo.')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && pnpm test tests/unit/tags.service.test.ts tests/unit/description.service.test.ts
```
Expected: FAIL for both

- [ ] **Step 3: Create `backend/src/services/tags.service.ts`**

```typescript
import path from 'path'
import { callLLM } from '../lib/openrouter'
import { loadTemplate } from '../lib/template-loader'
import { config } from '../config'

export async function generateTags(scriptText: string): Promise<string[]> {
  const fill = loadTemplate(
    path.join(config.PROMPTS_PATH, 'text_templates', 'tags_template.txt'),
  )
  const prompt = fill({ script: scriptText })
  const response = await callLLM(prompt)

  return response
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 10)
}
```

- [ ] **Step 4: Create `backend/src/services/description.service.ts`**

```typescript
import path from 'path'
import { callLLM } from '../lib/openrouter'
import { loadTemplate } from '../lib/template-loader'
import { config } from '../config'

export async function generateDescription(scriptText: string): Promise<string> {
  const fill = loadTemplate(
    path.join(config.PROMPTS_PATH, 'text_templates', 'description_template.txt'),
  )
  const prompt = fill({ script: scriptText })
  return callLLM(prompt)
}
```

- [ ] **Step 5: Run tests**

```bash
cd backend && pnpm test tests/unit/tags.service.test.ts tests/unit/description.service.test.ts
```
Expected: Both PASS

- [ ] **Step 6: Run all backend tests**

```bash
cd backend && pnpm test
```
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/tags.service.ts backend/src/services/description.service.ts \
  backend/tests/unit/tags.service.test.ts backend/tests/unit/description.service.test.ts
git commit -m "feat(tags-description): generate video tags and SEO description via OpenRouter"
```

---

*Continue to `PLAN_1_PART_4.md` for Tasks 17–23: Render, Thumbnail, Pipeline Orchestrator + SSE.*
