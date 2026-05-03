# Pipeline Flow — From Theme to Video

This document walks a new developer through the entire lifecycle of a generation request: from the moment the user types a theme in the browser to the moment they receive a finished video file. It covers every service, every external call, and every file produced along the way.

---

## Big Picture

```
User types theme + picks video type
        │
        ▼
[POST /api/generation/start]
  → LLM generates 3 title options
  → DB row created (status: pending_title_selection)
  → Titles sent back to browser
        │
        ▼
User picks a title
        │
        ▼
[POST /api/generation/:id/select-title]
  → DB row updated (status: processing)
  → Pipeline kicked off in background
        │
        ▼
[GET /api/generation/:id/stream]  ← browser opens SSE connection
  → Progress events emitted as each step completes
        │
        ▼
Video, thumbnails, tags, description returned in final SSE event
```

---

## Step 0 — User Input

**File:** `frontend/src/components/GenerationForm.tsx`

The user fills in two fields:

| Field | Values | Effect |
|-------|--------|--------|
| `theme` | Free text (e.g. "Como funciona a IA") | Drives the script and search queries |
| `videoType` | `short` (9:16, 1080×1920) or `long` (16:9, 1920×1080) | Controls aspect ratio and prompt template |

On submit, the frontend calls `POST /api/generation/start`.

---

## Step 1 — Title Generation

**Route:** `backend/src/routes/generation.ts` → `POST /start`  
**Service:** `backend/src/services/title.service.ts`  
**LLM call:** yes

The backend calls `generateTitles(theme, videoType)`, which sends the theme to the LLM (via OpenRouter) and receives 3 title suggestions.

A new row is inserted into the `generations` DB table with:
- `status: pending_title_selection`
- The 3 title options stored as JSON

The 3 titles are returned to the browser. The frontend renders `TitlePicker` so the user can select one.

---

## Step 2 — Title Selection and Pipeline Start

**Route:** `POST /api/generation/:id/select-title`

The user clicks a title. The backend:
1. Updates the DB row: `status: processing`, `title: selectedTitle`
2. Calls `runPipeline(...)` — but **does not await it**
3. Returns `{ generationId }` immediately

The browser then opens the SSE stream (`GET /api/generation/:id/stream`) to receive live progress.

---

## Step 3 — SSE Stream

**Route:** `GET /api/generation/:id/stream`  
**Lib:** `backend/src/lib/sse.ts`

A Server-Sent Events connection is held open. Every time a pipeline step starts or finishes, an `EmitFn` sends a `ProgressEvent` down this channel:

```ts
interface ProgressEvent {
  step: PipelineStep     // e.g. 'script', 'render', 'completed'
  status: 'processing' | 'done' | 'error'
  progress: number       // 0–100
  message?: string
  error?: string
  result?: GenerationResult
}
```

The frontend `useSSE` hook listens and updates the `ProgressBar` and `ResultPanel` components.

---

## Step 4 — Script Generation (10% → 20%)

**Service:** `backend/src/services/script.service.ts`  
**LLM call:** yes  
**Template:** `backend/prompts_templates/text_templates/short_template.txt` or `long_template.txt`

The LLM receives the theme and selected title and writes a full video script. The response is parsed into an array of `SceneBlock` objects:

```ts
interface SceneBlock {
  sceneId: number      // 1, 2, 3 ...
  description: string  // visual description (used for asset search)
  narration: string    // text that will be spoken aloud
}
```

A short video typically produces 5–8 scenes.

---

## Step 5 — Asset Search: Images (20% → 30%)

**Service:** `backend/src/services/asset-search.service.ts`  
**Lib:** `backend/src/lib/google-search.ts`  
**External:** SerpAPI → Google Images  
**LLM call:** yes (one per scene)

For each scene, two things happen:

**5a. Query generation**  
The scene `description` (in Portuguese) is sent to the LLM with instructions to produce a concise 2–4 word English search query suitable for stock footage — e.g., `"futuristic city skyline"`.

**5b. Image search**  
The query is sent to SerpAPI (`engine=google_images`). Results are filtered to images with width ≥ 1280px or height ≥ 720px. If the HD-filtered set is empty, the search is retried without the resolution hint.

Each scene gets an array of `AssetSearchResult` candidates:

```ts
interface AssetSearchResult {
  url: string
  width: number
  height: number
}
```

---

## Step 6 — Asset Search: Videos (30% → 38%)

**Service:** `backend/src/services/asset-search.service.ts`  
**External:** SerpAPI → Google Videos  
**LLM call:** yes (one per scene, same query from step 5a is reused)

The same English query is sent to SerpAPI (`engine=google_videos`). Results come back as YouTube/Vimeo links. A "cinematic 4K footage" variant is tried first; if it returns nothing, the base query is used. Videos are limited to `height <= 1080` in the yt-dlp format selector.

---

## Step 7 — Asset Download (38% → 42%)

**Service:** `backend/src/services/asset-download.service.ts`  
**External:** yt-dlp, FFmpeg, HTTPS

For each scene, the pipeline tries to download a **video** first. If all video candidates fail, it falls back to an **image**. Within each type, candidates are tried in order until one succeeds.

### Video download (`downloadVideoSegment`)

```
URL is a direct .mp4?
  YES → ffmpeg -i <url> -t <sceneSeconds> -c copy → scene_N.mp4
  NO  → yt-dlp (YouTube/Vimeo/etc.)
          Attempt 1: --download-sections *0:00-N (partial)
            ↓ success → rename if yt-dlp appended .mp4 extension
          Attempt 2: full download → ffmpeg trim (libx264 ultrafast)
            (used when partial-section seeking is not supported by the platform)
```

Files land in `storage/temp/<generationId>/assets/scene_N.mp4`.

### Image download (`downloadWithFallback`)

Plain HTTPS download with redirect following (up to 5 hops). Empty responses (0 bytes) are detected and rejected so the next candidate is tried.

Files land in `storage/temp/<generationId>/assets/scene_N.jpg`.

Each downloaded asset is recorded as an `AssetRecord`:

```ts
interface AssetRecord {
  sceneId: number
  type: 'image' | 'video'
  url: string
  localPath: string
  width: number
  height: number
}
```

---

## Step 8 — Text-to-Speech (42% → 55%)

**Service:** `backend/src/services/tts.service.ts`  
**Lib:** `backend/src/lib/piper.ts`  
**External:** Piper TTS (local Python process)

For each scene, the `narration` text is piped to a Piper subprocess:

```
echo "<narration>" | piper --model <model.onnx> --output_file scene_N.wav
```

The individual `.wav` files are then concatenated into a single `narration.wav` using `ffmpeg -f concat`. The service also returns per-scene `durations` (in milliseconds), which are used by the subtitle generator.

Output: `storage/temp/<generationId>/narration.wav`

---

## Step 9 — Subtitle Generation (55% → 60%)

**Service:** `backend/src/services/subtitle.service.ts`

Uses the per-scene durations from step 8 to build an SRT file. Each scene's narration text becomes one subtitle block with precise start/end timestamps.

Output: `storage/temp/<generationId>/subtitles.srt`

---

## Step 10 — Video Render (60% → 80%)

**Service:** `backend/src/services/render.service.ts`  
**Lib:** `backend/src/lib/ffmpeg.ts`  
**External:** FFmpeg

This is the most complex step. It happens in three sub-phases:

### 10a. Pre-trim video clips

For each `AssetRecord` of type `video`, FFmpeg re-encodes the clip to exactly `floor(audioDurationMs / sceneCount)` seconds:

```
ffmpeg -i scene_N.mp4 -t <sceneDuration>
       -c:v libx264 -preset ultrafast -c:a aac
       → scene_N_trim.mp4
```

`libx264 ultrafast` is used (rather than `-c copy`) because downloaded clips may be VP9 or AV1, which cannot be stream-copied into an MP4 container. Images are passed through unchanged.

### 10b. Build concat list

`buildConcatFile` produces a text file for the FFmpeg concat demuxer:

```
# For images:
file '/tmp/.../scene_1.jpg'
duration 5.0

# For pre-trimmed videos:
file '/tmp/.../scene_2_trim.mp4'
```

Note: videos get no `duration` directive — their duration is already exact from the trim step. `inpoint`/`outpoint` is intentionally avoided because all source clips start at timestamp 0, which causes the concat demuxer to collapse them all into the same output time range.

### 10c. Final FFmpeg render

```
ffmpeg
  -f concat -safe 0 -i concat.txt     (visual track)
  -i narration.wav                     (audio track)
  -vf "scale=W:H:force_original_aspect_ratio=increase,
       crop=W:H,
       subtitles='subtitles.srt':force_style='...'"
  -c:v libx264 -crf 18 -preset fast
  -c:a aac -b:a 192k
  -movflags +faststart
  -map 0:v:0 -map 1:a:0 -shortest
  → output/<generationId>/video.mp4
```

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `crf 18` | near-lossless | Professional quality |
| `preset fast` | good speed/quality balance | Reasonable render time |
| `aac 192k` | broadcast standard | Clear narration audio |
| `+faststart` | moov atom at front | Allows streaming before full download |
| `force_original_aspect_ratio=increase` + `crop` | fill frame without letterbox | Clean commercial look |
| Subtitle style | Arial 22px bold, white text, black outline | Readable on any background |

Output: `storage/output/<generationId>/video.mp4`

---

## Step 11 — Thumbnail Extraction (80% → 88%)

**Service:** `backend/src/services/thumbnail.service.ts`

Three frames are extracted from the rendered video at 10%, 50%, and 90% of its total duration using `ffprobe` + `ffmpeg -frames:v 1`.

Output: `storage/output/<generationId>/thumb_1.jpg`, `thumb_2.jpg`, `thumb_3.jpg`

---

## Step 12 — Tags Generation (88% → 93%)

**Service:** `backend/src/services/tags.service.ts`  
**LLM call:** yes

The concatenated narration text is sent to the LLM, which returns up to 10 comma-separated tags suitable for YouTube/social upload.

---

## Step 13 — Description Generation (93% → 97%)

**Service:** `backend/src/services/description.service.ts`  
**LLM call:** yes

The same narration text produces an SEO-optimised description paragraph (Portuguese, YouTube-ready).

---

## Step 14 — Completion Event (100%)

The pipeline emits a final SSE event:

```ts
{
  step: 'completed',
  status: 'done',
  progress: 100,
  message: 'Vídeo gerado com sucesso!',
  result: {
    videoPath: '/output/<generationId>/video.mp4',
    thumbnails: ['/output/<generationId>/thumb_1.jpg', ...],
    tags: ['tag1', 'tag2', ...],
    description: 'SEO description text...'
  }
}
```

The DB row is updated to `status: completed`. The frontend `ResultPanel` renders the video player, thumbnails, and metadata.

---

## Files Produced per Generation

```
storage/
├── temp/
│   └── <generationId>/
│       ├── assets/
│       │   ├── scene_1.mp4          ← raw downloaded video (from yt-dlp)
│       │   ├── scene_1_trim.mp4     ← trimmed video (pre-render)
│       │   ├── scene_2.jpg          ← downloaded image (fallback)
│       │   └── ...
│       ├── tts/
│       │   ├── scene_1.wav          ← per-scene Piper output
│       │   ├── scene_2.wav
│       │   └── ...
│       ├── narration.wav            ← all scenes concatenated
│       ├── subtitles.srt
│       └── concat.txt               ← FFmpeg concat demuxer input
└── output/
    └── <generationId>/
        ├── video.mp4                ← final video
        ├── thumb_1.jpg
        ├── thumb_2.jpg
        └── thumb_3.jpg
```

Temp files are left on disk after generation (useful for debugging). The `output/` directory is served as static files by Express under `/output/*`.

---

## Progress Percentages at a Glance

| Step | Start | End | Key external call |
|------|-------|-----|-------------------|
| Script | 10% | 20% | OpenRouter (LLM) |
| Image search | 20% | 30% | SerpAPI + OpenRouter |
| Video search | 30% | 38% | SerpAPI + OpenRouter |
| Asset download | 38% | 42% | yt-dlp + HTTPS |
| TTS | 42% | 55% | Piper (local) |
| Subtitles | 55% | 60% | — |
| Render | 60% | 80% | FFmpeg |
| Thumbnails | 80% | 88% | FFmpeg |
| Tags | 88% | 93% | OpenRouter (LLM) |
| Description | 93% | 97% | OpenRouter (LLM) |
| Completed | 100% | 100% | — |

---

## Error Handling

Every step is wrapped in `withEmit`, which:
1. Emits a `processing` event before the step
2. Emits a `done` event on success
3. Emits an `error` event on failure and rethrows

The DB row is updated to `status: failed` when the pipeline throws. The SSE connection closes, and the frontend displays the error message.

Asset downloads are tolerant: each scene tries all candidates before giving up. If no video is available, it falls back to an image. If absolutely no assets are downloaded across all scenes, the pipeline throws.
