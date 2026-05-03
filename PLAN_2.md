# Google Image & Video Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Pexels API with a Google Custom Search API scraper that returns multiple candidate URLs per scene and retries with the next candidate if a download fails.

**Architecture:** A new `google-search.ts` lib module calls the Google Custom Search JSON API (free, no headless browser needed). `asset-search.service.ts` is rewritten to return `AssetSearchResult[]` (multiple candidates) instead of a single result. A new `downloadWithFallback` helper in `asset-download.service.ts` iterates candidates until one succeeds. `pipeline.service.ts` is updated to pass candidate arrays to this helper.

**Tech Stack:** Google Custom Search JSON API (`https://www.googleapis.com/customsearch/v1`), Node.js built-in `https`, TypeScript. No new npm packages required.

---

## Background: Google Custom Search Setup

Before running tasks, create a free Google Custom Search Engine:
1. Go to https://programmablesearchengine.google.com and create a new engine set to "Search the entire web"
2. Note the **Search engine ID** (CSE ID, looks like `abc123:xyz`)
3. Go to https://console.cloud.google.com → APIs → Custom Search API → enable it → create a credential (API key)
4. Add to `backend/.env`:
   ```
   GOOGLE_API_KEY=your_api_key_here
   GOOGLE_CSE_ID=your_cse_id_here
   ```

Free tier: 100 queries/day. Each generation uses `2 × scene_count` queries (1 image + 1 video per scene).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/src/config.ts` | Modify | Add `GOOGLE_API_KEY`, `GOOGLE_CSE_ID`; remove `PEXELS_API_KEY` |
| `backend/.env.example` | Modify | Replace Pexels key with Google keys |
| `backend/src/lib/google-search.ts` | Create | Raw Google CSE HTTP calls, returns `AssetSearchResult[]` |
| `backend/src/services/asset-search.service.ts` | Replace | `searchImages` / `searchVideos` now return `AssetSearchResult[]` |
| `backend/src/services/asset-download.service.ts` | Modify | Add `downloadWithFallback` |
| `backend/src/services/pipeline.service.ts` | Modify | Use candidate arrays + `downloadWithFallback` |
| `backend/tests/unit/asset-search.service.test.ts` | Replace | Tests for Google CSE responses |
| `backend/tests/unit/asset-download.service.test.ts` | Modify | Tests for `downloadWithFallback` |
| `backend/tests/unit/pipeline.service.test.ts` | Modify | Mocks updated to return `AssetSearchResult[]` |

---

## Task 1: Update config — add Google keys, remove Pexels key

**Files:**
- Modify: `backend/src/config.ts`
- Modify: `backend/.env.example`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/tests/unit/config.test.ts  (existing file — ADD these cases)
// At top of the existing describe block, after existing tests:

it('throws when GOOGLE_API_KEY is missing', () => {
  jest.resetModules()
  const saved = process.env.GOOGLE_API_KEY
  delete process.env.GOOGLE_API_KEY
  expect(() => require('../../src/config')).toThrow('Invalid environment variables')
  process.env.GOOGLE_API_KEY = saved ?? 'test'
})

it('throws when GOOGLE_CSE_ID is missing', () => {
  jest.resetModules()
  const saved = process.env.GOOGLE_CSE_ID
  delete process.env.GOOGLE_CSE_ID
  expect(() => require('../../src/config')).toThrow('Invalid environment variables')
  process.env.GOOGLE_CSE_ID = saved ?? 'test'
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest tests/unit/config.test.ts --passWithNoTests
```

Expected: FAIL — `GOOGLE_API_KEY` and `GOOGLE_CSE_ID` are not in the schema yet.

- [ ] **Step 3: Update `backend/src/config.ts`**

Replace the full file:

```typescript
import { z } from 'zod'
import path from 'path'

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().default('openai/gpt-4o-mini'),

  PIPER_MODEL_PATH: z.string().default('pt_BR-faber-medium'),
  FFMPEG_PATH: z.string().default('ffmpeg'),

  GOOGLE_API_KEY: z.string().min(1),
  GOOGLE_CSE_ID: z.string().min(1),

  DATABASE_URL: z.string().default('./storage/omnigen.db'),
  STORAGE_PATH: z.string().default('./storage'),
  PROMPTS_PATH: z.string().default('./prompts_templates'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const config = {
  ...parsed.data,
  PIPER_MODEL_PATH: path.resolve(parsed.data.PIPER_MODEL_PATH),
  DATABASE_URL: path.resolve(parsed.data.DATABASE_URL),
  STORAGE_PATH: path.resolve(parsed.data.STORAGE_PATH),
  PROMPTS_PATH: path.resolve(parsed.data.PROMPTS_PATH),
}
```

- [ ] **Step 4: Update `backend/.env.example`**

Replace the `PEXELS_API_KEY` line with:

```
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_custom_search_engine_id_here
```

- [ ] **Step 5: Update every test file that sets `PEXELS_API_KEY`**

Search for `PEXELS_API_KEY` in `backend/tests/` and replace each occurrence:

```bash
# Run in backend/tests/
grep -rn "PEXELS_API_KEY" .
```

For every file that has `process.env.PEXELS_API_KEY = 'test'`, replace that line with:

```typescript
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
```

Files affected (based on codebase grep): all `tests/unit/*.test.ts` and `tests/integration/*.test.ts` that set `PEXELS_API_KEY`.

- [ ] **Step 6: Run config tests to verify they pass**

```bash
cd backend && npx jest tests/unit/config.test.ts --passWithNoTests
```

Expected: all config tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/config.ts backend/.env.example backend/tests/
git commit -m "feat: replace PEXELS_API_KEY with GOOGLE_API_KEY + GOOGLE_CSE_ID in config"
```

---

## Task 2: Create `backend/src/lib/google-search.ts`

**Files:**
- Create: `backend/src/lib/google-search.ts`
- Create: `backend/tests/unit/google-search.test.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/unit/google-search.test.ts`:

```typescript
process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
process.env.NODE_ENV = 'test'

import nock from 'nock'
import { googleImageSearch, googleVideoSearch } from '../../src/lib/google-search'

const BASE = 'https://www.googleapis.com'

describe('googleImageSearch', () => {
  afterEach(() => nock.cleanAll())

  it('returns image candidates from CSE response', async () => {
    nock(BASE)
      .get('/customsearch/v1')
      .query(true)
      .reply(200, {
        items: [
          { link: 'https://example.com/img1.jpg', image: { width: 1920, height: 1080 } },
          { link: 'https://example.com/img2.jpg', image: { width: 1280, height: 720 } },
        ],
      })

    const results = await googleImageSearch('Zeus thunder', 5)
    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://example.com/img1.jpg')
    expect(results[0].width).toBe(1920)
    expect(results[0].height).toBe(1080)
  })

  it('returns empty array when no items', async () => {
    nock(BASE).get('/customsearch/v1').query(true).reply(200, {})
    const results = await googleImageSearch('nothing found', 5)
    expect(results).toEqual([])
  })

  it('caps count at 10', async () => {
    let capturedQuery: Record<string, string> = {}
    nock(BASE)
      .get('/customsearch/v1')
      .query((q) => { capturedQuery = q as Record<string, string>; return true })
      .reply(200, { items: [] })

    await googleImageSearch('test', 20)
    expect(capturedQuery.num).toBe('10')
  })
})

describe('googleVideoSearch', () => {
  afterEach(() => nock.cleanAll())

  it('returns only direct mp4 links', async () => {
    nock(BASE)
      .get('/customsearch/v1')
      .query(true)
      .reply(200, {
        items: [
          { link: 'https://cdn.example.com/video.mp4' },
          { link: 'https://www.youtube.com/watch?v=abc' },
          { link: 'https://cdn.example.com/clip.MP4?token=xyz' },
        ],
      })

    const results = await googleVideoSearch('storm', 5)
    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://cdn.example.com/video.mp4')
    expect(results[1].url).toBe('https://cdn.example.com/clip.MP4?token=xyz')
  })

  it('returns empty array when no mp4 links found', async () => {
    nock(BASE)
      .get('/customsearch/v1')
      .query(true)
      .reply(200, { items: [{ link: 'https://youtube.com/watch?v=x' }] })

    const results = await googleVideoSearch('test', 5)
    expect(results).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest tests/unit/google-search.test.ts --passWithNoTests
```

Expected: FAIL — `google-search.ts` does not exist.

- [ ] **Step 3: Create `backend/src/lib/google-search.ts`**

```typescript
import https from 'https'
import { config } from '../config'
import type { AssetSearchResult } from '../services/asset-search.service'

interface CseItem {
  link: string
  image?: { width: number; height: number }
}

interface CseResponse {
  items?: CseItem[]
}

function cseFetch(url: string): Promise<CseResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as CseResponse)
        } catch (e) {
          reject(new Error(`Failed to parse Google CSE response: ${e}`))
        }
      })
    })
    req.on('error', reject)
  })
}

export async function googleImageSearch(query: string, count: number): Promise<AssetSearchResult[]> {
  const params = new URLSearchParams({
    key: config.GOOGLE_API_KEY,
    cx: config.GOOGLE_CSE_ID,
    q: query,
    searchType: 'image',
    num: String(Math.min(count, 10)),
    imgSize: 'large',
  })

  const data = await cseFetch(`https://www.googleapis.com/customsearch/v1?${params}`)

  return (data.items ?? []).map((item) => ({
    url: item.link,
    width: item.image?.width ?? 1920,
    height: item.image?.height ?? 1080,
  }))
}

export async function googleVideoSearch(query: string, count: number): Promise<AssetSearchResult[]> {
  const params = new URLSearchParams({
    key: config.GOOGLE_API_KEY,
    cx: config.GOOGLE_CSE_ID,
    q: `${query} filetype:mp4 -site:youtube.com -site:vimeo.com -site:dailymotion.com`,
    num: String(Math.min(count, 10)),
  })

  const data = await cseFetch(`https://www.googleapis.com/customsearch/v1?${params}`)

  return (data.items ?? [])
    .filter((item) => /\.mp4(\?|$)/i.test(item.link))
    .map((item) => ({
      url: item.link,
      width: 1920,
      height: 1080,
    }))
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx jest tests/unit/google-search.test.ts --passWithNoTests
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/google-search.ts backend/tests/unit/google-search.test.ts
git commit -m "feat: add Google Custom Search lib (images + videos)"
```

---

## Task 3: Replace `asset-search.service.ts` — return candidate arrays

**Files:**
- Replace: `backend/src/services/asset-search.service.ts`
- Replace: `backend/tests/unit/asset-search.service.test.ts`

- [ ] **Step 1: Write the failing test**

Replace `backend/tests/unit/asset-search.service.test.ts` entirely:

```typescript
process.env.OPENROUTER_API_KEY = 'test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.GOOGLE_CSE_ID = 'test-cse-id'
process.env.NODE_ENV = 'test'

jest.mock('../../src/lib/google-search')

import * as googleSearch from '../../src/lib/google-search'
import { searchImages, searchVideos } from '../../src/services/asset-search.service'

const mockImageSearch = googleSearch.googleImageSearch as jest.MockedFunction<typeof googleSearch.googleImageSearch>
const mockVideoSearch = googleSearch.googleVideoSearch as jest.MockedFunction<typeof googleSearch.googleVideoSearch>

describe('searchImages', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns candidate array from googleImageSearch', async () => {
    mockImageSearch.mockResolvedValueOnce([
      { url: 'https://example.com/1.jpg', width: 1920, height: 1080 },
      { url: 'https://example.com/2.jpg', width: 1280, height: 720 },
    ])

    const results = await searchImages('Zeus thunder', 'portrait')
    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://example.com/1.jpg')
    expect(mockImageSearch).toHaveBeenCalledWith('Zeus thunder portrait', 5)
  })

  it('appends orientation to query', async () => {
    mockImageSearch.mockResolvedValueOnce([])
    await searchImages('forest fire', 'landscape')
    expect(mockImageSearch).toHaveBeenCalledWith('forest fire landscape', 5)
  })

  it('returns empty array when CSE returns nothing', async () => {
    mockImageSearch.mockResolvedValueOnce([])
    const results = await searchImages('nothing', 'portrait')
    expect(results).toEqual([])
  })
})

describe('searchVideos', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns candidate array from googleVideoSearch', async () => {
    mockVideoSearch.mockResolvedValueOnce([
      { url: 'https://cdn.example.com/storm.mp4', width: 1920, height: 1080 },
    ])

    const results = await searchVideos('storm lightning')
    expect(results).toHaveLength(1)
    expect(results[0].url).toContain('.mp4')
    expect(mockVideoSearch).toHaveBeenCalledWith('storm lightning', 5)
  })

  it('returns empty array when no videos found', async () => {
    mockVideoSearch.mockResolvedValueOnce([])
    const results = await searchVideos('obscure')
    expect(results).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest tests/unit/asset-search.service.test.ts --passWithNoTests
```

Expected: FAIL — `searchImages` still returns `AssetSearchResult | null` (old signature).

- [ ] **Step 3: Replace `backend/src/services/asset-search.service.ts`**

```typescript
import { googleImageSearch, googleVideoSearch } from '../lib/google-search'

export type Orientation = 'portrait' | 'landscape'

export interface AssetSearchResult {
  url: string
  width: number
  height: number
}

const CANDIDATES_PER_SCENE = 5

export async function searchImages(
  query: string,
  orientation: Orientation,
): Promise<AssetSearchResult[]> {
  return googleImageSearch(`${query} ${orientation}`, CANDIDATES_PER_SCENE)
}

export async function searchVideos(query: string): Promise<AssetSearchResult[]> {
  return googleVideoSearch(query, CANDIDATES_PER_SCENE)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx jest tests/unit/asset-search.service.test.ts --passWithNoTests
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/asset-search.service.ts backend/tests/unit/asset-search.service.test.ts
git commit -m "feat: asset-search returns candidate arrays via Google CSE"
```

---

## Task 4: Add `downloadWithFallback` to asset-download service

**Files:**
- Modify: `backend/src/services/asset-download.service.ts`
- Modify: `backend/tests/unit/asset-download.service.test.ts`

- [ ] **Step 1: Write the failing test**

Add these cases to the existing `backend/tests/unit/asset-download.service.test.ts` inside the `describe('downloadAsset', ...)` block, after the existing tests:

```typescript
// Add this new describe block at the end of the file:
import { downloadWithFallback } from '../../src/services/asset-download.service'

describe('downloadWithFallback', () => {
  beforeAll(() => fs.mkdirSync(TMP, { recursive: true }))

  afterEach(() => nock.cleanAll())

  it('downloads the first successful candidate', async () => {
    nock('https://cdn.example.com').get('/video.mp4').reply(200, Buffer.from('mp4-data'))

    const candidates = [{ url: 'https://cdn.example.com/video.mp4', width: 1920, height: 1080 }]
    const dest = path.join(TMP, 'fallback_ok.mp4')
    const result = await downloadWithFallback(candidates, dest)

    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://cdn.example.com/video.mp4')
    expect(fs.existsSync(dest)).toBe(true)
  })

  it('tries the next candidate when the first fails', async () => {
    nock('https://cdn.example.com').get('/bad.mp4').reply(404)
    nock('https://cdn.example.com').get('/good.mp4').reply(200, Buffer.from('ok'))

    const candidates = [
      { url: 'https://cdn.example.com/bad.mp4', width: 1920, height: 1080 },
      { url: 'https://cdn.example.com/good.mp4', width: 1920, height: 1080 },
    ]
    const dest = path.join(TMP, 'fallback_retry.mp4')
    const result = await downloadWithFallback(candidates, dest)

    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://cdn.example.com/good.mp4')
  })

  it('returns null when all candidates fail', async () => {
    nock('https://cdn.example.com').get('/a.mp4').reply(404)
    nock('https://cdn.example.com').get('/b.mp4').reply(500)

    const candidates = [
      { url: 'https://cdn.example.com/a.mp4', width: 1920, height: 1080 },
      { url: 'https://cdn.example.com/b.mp4', width: 1920, height: 1080 },
    ]
    const dest = path.join(TMP, 'fallback_all_fail.mp4')
    const result = await downloadWithFallback(candidates, dest)

    expect(result).toBeNull()
  })

  it('returns null for empty candidate list', async () => {
    const dest = path.join(TMP, 'fallback_empty.mp4')
    const result = await downloadWithFallback([], dest)
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest tests/unit/asset-download.service.test.ts --passWithNoTests
```

Expected: FAIL — `downloadWithFallback` is not exported yet.

- [ ] **Step 3: Add `downloadWithFallback` to `backend/src/services/asset-download.service.ts`**

Append to the existing file (keep all existing code, add at the end):

```typescript
export async function downloadWithFallback(
  candidates: AssetSearchResult[],
  destPath: string,
): Promise<AssetSearchResult | null> {
  for (const candidate of candidates) {
    try {
      await downloadAsset(candidate.url, destPath)
      return candidate
    } catch {
      // try next candidate
    }
  }
  return null
}
```

Also add the import at the top of the file:

```typescript
import type { AssetSearchResult } from './asset-search.service'
```

The full updated file becomes:

```typescript
import fs from 'fs'
import https from 'https'
import http from 'http'
import path from 'path'
import type { AssetSearchResult } from './asset-search.service'

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

export async function downloadWithFallback(
  candidates: AssetSearchResult[],
  destPath: string,
): Promise<AssetSearchResult | null> {
  for (const candidate of candidates) {
    try {
      await downloadAsset(candidate.url, destPath)
      return candidate
    } catch {
      // try next candidate
    }
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx jest tests/unit/asset-download.service.test.ts --passWithNoTests
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/asset-download.service.ts backend/tests/unit/asset-download.service.test.ts
git commit -m "feat: add downloadWithFallback — retries next candidate on failure"
```

---

## Task 5: Update `pipeline.service.ts` — use candidate arrays and fallback download

**Files:**
- Modify: `backend/src/services/pipeline.service.ts`

- [ ] **Step 1: Open `backend/src/services/pipeline.service.ts` and update the imports**

Change the existing import lines from:

```typescript
import { searchImages, searchVideos } from './asset-search.service'
import { downloadAsset, ensureDir } from './asset-download.service'
```

To:

```typescript
import { searchImages, searchVideos } from './asset-search.service'
import { downloadWithFallback, ensureDir } from './asset-download.service'
```

- [ ] **Step 2: Replace the assets download block**

Find and replace the entire `assets` block (from `const assets: AssetRecord[]` to the closing `})`):

```typescript
const assets: AssetRecord[] = await withEmit(emit, 'assets', 38, 42, 'Baixando assets...', async () => {
  const assetsDir = path.join(storagePath, 'temp', generationId, 'assets')
  ensureDir(assetsDir)
  const records: AssetRecord[] = []

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    const videoCandidates = videoSearchResults[i]
    const imageCandidates = assetSearchResults[i]

    // Try video candidates first
    const videoDestPath = path.join(assetsDir, `scene_${scene.sceneId}.mp4`)
    const downloadedVideo = await downloadWithFallback(videoCandidates, videoDestPath)
    if (downloadedVideo) {
      records.push({
        sceneId: scene.sceneId,
        type: 'video',
        url: downloadedVideo.url,
        localPath: videoDestPath,
        width: downloadedVideo.width,
        height: downloadedVideo.height,
      })
      continue
    }

    // Fall back to image candidates
    const imageDestPath = path.join(assetsDir, `scene_${scene.sceneId}.jpg`)
    const downloadedImage = await downloadWithFallback(imageCandidates, imageDestPath)
    if (downloadedImage) {
      records.push({
        sceneId: scene.sceneId,
        type: 'image',
        url: downloadedImage.url,
        localPath: imageDestPath,
        width: downloadedImage.width,
        height: downloadedImage.height,
      })
    }
  }

  return records
})
```

- [ ] **Step 3: Run the pipeline tests**

```bash
cd backend && npx jest tests/unit/pipeline.service.test.ts --passWithNoTests
```

Expected: FAIL — the pipeline mock still returns `null` (old `AssetSearchResult | null` shape) instead of `AssetSearchResult[]`.

- [ ] **Step 4: Commit pipeline changes (even before tests pass)**

```bash
git add backend/src/services/pipeline.service.ts
git commit -m "feat: pipeline uses downloadWithFallback with candidate arrays"
```

---

## Task 6: Update pipeline tests for new array signatures

**Files:**
- Modify: `backend/tests/unit/pipeline.service.test.ts`

- [ ] **Step 1: Update the mocks in `backend/tests/unit/pipeline.service.test.ts`**

Change these two mock lines:

```typescript
// OLD:
;(assetSearchSvc.searchImages as jest.Mock).mockResolvedValue({ url: 'https://example.com/1.jpg', width: 1080, height: 1920 })
;(assetSearchSvc.searchVideos as jest.Mock).mockResolvedValue(null)
;(assetDownloadSvc.downloadAsset as jest.Mock).mockResolvedValue(undefined)
```

To:

```typescript
// NEW:
;(assetSearchSvc.searchImages as jest.Mock).mockResolvedValue([
  { url: 'https://example.com/1.jpg', width: 1080, height: 1920 },
])
;(assetSearchSvc.searchVideos as jest.Mock).mockResolvedValue([])
;(assetDownloadSvc.downloadWithFallback as jest.Mock).mockResolvedValue({
  url: 'https://example.com/1.jpg',
  width: 1080,
  height: 1920,
})
```

Also update the import line for `assetDownloadSvc` usage — the test currently mocks `downloadAsset`. Replace `downloadAsset` with `downloadWithFallback` in the mock imports. The mock declaration at the top of the file stays as-is (`jest.mock('../../src/services/asset-download.service')`), since Jest auto-mocks all exports.

- [ ] **Step 2: Run all backend tests**

```bash
cd backend && npx jest --passWithNoTests
```

Expected: all 24 test suites PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/unit/pipeline.service.test.ts
git commit -m "test: update pipeline mock for asset-search array return type"
```

---

## Task 7: Full test run and cleanup

- [ ] **Step 1: Run the full test suite**

```bash
cd backend && npx jest --passWithNoTests
```

Expected output:
```
Test Suites: 25 passed, 25 total   ← one new suite (google-search.test.ts)
Tests:       N passed, N total
```

- [ ] **Step 2: Run TypeScript typecheck**

```bash
cd backend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Add `GOOGLE_API_KEY` and `GOOGLE_CSE_ID` to your `.env` file**

```
GOOGLE_API_KEY=<your real key>
GOOGLE_CSE_ID=<your real CSE ID>
```

- [ ] **Step 4: Start the backend and generate one test video manually**

```bash
cd backend && npm run dev
```

Verify in the browser that:
- Images visually match the scene description (Google relevance is higher than Pexels)
- If a specific image URL fails, the pipeline silently tries the next candidate without crashing

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: verify Google image/video search end-to-end"
```

---

## Notes

**Rate limits:** Free Google CSE tier = 100 queries/day. A 5-scene short video uses 10 queries (5 image + 5 video). At this rate you can generate ~10 videos/day for free. To increase the limit, enable billing in Google Cloud Console ($5 per 1000 additional queries).

**Video availability:** Google `filetype:mp4` search returns direct MP4 links hosted on public CDNs, stock sites (Coverr, Videvo, etc.), and news sites. If no direct MP4 links are found for a scene, the pipeline automatically falls back to a Google image for that scene — no crash.

**Removing Pexels entirely:** After this plan is complete, `PEXELS_API_KEY` no longer exists in the codebase. Remove it from your `.env` file too.
