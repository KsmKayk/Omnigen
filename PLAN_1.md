# Omnigen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Omnigen — a web app that accepts a topic + video type from the user and generates a complete short or long video with script, TTS narration, online-sourced assets, subtitles, thumbnails, tags, and description.

**Architecture:** Synchronous linear pipeline orchestrated by the backend, with Server-Sent Events (SSE) streaming real-time progress to the frontend. No queues, no workers, no cache — single-process sequential execution for maximum simplicity and debuggability.

**Tech Stack:** Node.js + TypeScript (Express backend), Next.js 14 App Router (frontend), SQLite + Drizzle ORM, OpenRouter (via OpenAI SDK), Piper TTS (local Python), FFmpeg (fluent-ffmpeg), Pexels API (images + videos), Pino (logger), Jest + Supertest (tests).

---

## Parts Index

| File | Content |
|------|---------|
| `PLAN_1.md` | Architecture, strategies, folder structure, roadmap (this file) |
| `PLAN_1_PART_2.md` | Tasks 1–8: Project setup + backend core infrastructure |
| `PLAN_1_PART_3.md` | Tasks 9–16: Generation pipeline services (title → subtitle) |
| `PLAN_1_PART_4.md` | Tasks 17–23: Render, thumbnail, tags, description, pipeline orchestrator + SSE |
| `PLAN_1_PART_5.md` | Tasks 24–31: API routes + frontend core + design system |
| `PLAN_1_PART_6.md` | Tasks 32–39: Frontend pages/components + README + final integration |

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Next.js)                                      │
│  Tab 1: Generation  Tab 2: History  Tab 3: Logs         │
│         │                                               │
│  POST /api/generation/start                             │
│  GET  /api/generation/stream?id=X (SSE)                 │
│  POST /api/generation/:id/select-title                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP + SSE
┌──────────────────────▼──────────────────────────────────┐
│  Express Backend (port 3001)                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Pipeline Service (linear, synchronous)            │ │
│  │  1. titleService.generate()                        │ │
│  │  2. scriptService.generate()                       │ │
│  │  3. assetSearchService.search()                    │ │
│  │  4. assetDownloadService.download()                │ │
│  │  5. ttsService.synthesize()                        │ │
│  │  6. subtitleService.generate()                     │ │
│  │  7. renderService.compose()                        │ │
│  │  8. thumbnailService.generate()                    │ │
│  │  9. tagsService.generate()                         │ │
│  │  10. descriptionService.generate()                 │ │
│  └────────────────────────────────────────────────────┘ │
│  SQLite (Drizzle ORM)    Pino Logger    Piper TTS        │
└─────────────────────────────────────────────────────────┘
```

### Two-Phase Generation Flow

The pipeline is split into two SSE streams separated by a user action (title selection):

**Phase 1** — `POST /api/generation/start` → creates DB record, starts SSE, generates 3 titles, emits `titles_ready`, pauses.

**Phase 2** — `POST /api/generation/:id/select-title` → user selects title → `GET /api/generation/:id/stream` resumes, runs steps 2–10, emits progress events, emits `completed`.

This avoids a long-lived SSE connection waiting on user input.

---

## 2. Omnigen Branding Strategy

The product name **Omnigen** appears in all public-facing surfaces: the browser tab title, the `<h1>` hero, the README headline, package names (`omnigen-backend`, `omnigen-frontend`), and the database filename (`omnigen.db`). The brand voice is confident, minimal, and premium — matching the Kraken-inspired design system. No abbreviations, no suffixes ("v2", "app", "web") in user-visible text.

---

## 3. Design Strategy (DESIGN.md)

The frontend implements the Kraken-inspired design system defined in `DESIGN.md` as CSS custom properties in `frontend/src/styles/design-tokens.css`. All components consume tokens — never raw hex values inline.

Key decisions:
- **Primary CTA**: Kraken Purple `#7132f5`, 12px radius, `13px 16px` padding
- **Typography**: IBM Plex Sans (Google Fonts, free) as the `Kraken-Product` fallback; use it for all UI text. Treat IBM Plex Sans Bold as `Kraken-Brand` for headings.
- **Background**: White `#ffffff` with near-black `#101114` text
- **Shadows**: Whisper-level only — `rgba(0,0,0,0.03) 0px 4px 24px`
- **Borders**: `#dedee5` dividers, `rgba(104,107,130,0.24)` subtle borders
- Tailwind CSS configured with the design token palette — no arbitrary values

---

## 4. README Strategy

`README.md` at the repo root is treated as a first-class product artifact. It must cover all 19 sections listed in the spec (vision, value proposition, architecture overview, stack, setup, install, config, run, test, folder structure, flow, technical decisions, observability, troubleshooting, roadmap, conventions, env docs, dev instructions, contribution guide). Written in English. Includes code blocks for every command. Uses badges (build status, license, Node.js version). Reviewed for clarity before every release.

---

## 5. Synchronous Architecture Strategy

The pipeline runs inside a single async function chain. Each step `await`s the previous. If any step throws, the error propagates to the route handler, which writes the error to the DB record and emits an SSE `error` event with the step name and message. No step runs until the previous one resolves. This makes stack traces unambiguous and retry logic straightforward (re-run from last failed step).

---

## 6. Real-Time Progress Strategy

**Backend emission** — The pipeline receives an `emit(event)` callback injected by the route handler. The route handler calls `res.write()` with SSE-formatted data. Each service calls `emit()` before and after its work.

**SSE event schema:**
```typescript
interface ProgressEvent {
  step: PipelineStep       // e.g. 'script'
  status: 'processing' | 'done' | 'error'
  progress: number         // 0–100
  message?: string         // human-readable status in pt-BR
  error?: string
}

type PipelineStep =
  | 'titles' | 'script' | 'images' | 'videos'
  | 'tts' | 'subtitles' | 'render' | 'thumbnails'
  | 'tags' | 'description' | 'saving' | 'completed'
```

**Progress percentages:**
| Step | Start % | End % |
|------|---------|-------|
| titles | 5 | 10 |
| script | 10 | 20 |
| images | 20 | 30 |
| videos | 30 | 40 |
| tts | 40 | 55 |
| subtitles | 55 | 60 |
| render | 60 | 80 |
| thumbnails | 80 | 88 |
| tags | 88 | 93 |
| description | 93 | 97 |
| saving | 97 | 100 |

**Frontend consumption** — `useSSE` hook wraps the browser's `EventSource` API. Each `message` event updates a `steps` state map. The `ProgressBar` component reads this state. On `error` event, the UI shows a retry button for the failed step.

---

## 7. Language Strategy

- **Technical layer** (all code): English — file names, variable names, function names, class names, type names, table names, column names, test names, log messages, commit messages, branch names, comments, technical docs
- **Product layer** (UI text): Portuguese (pt-BR) — labels, headings, button text, error messages shown to user, narration scripts, generated content

This separation is enforced by linting convention: any Portuguese string literal in backend `.ts` files (outside `prompts_templates/`) is a code smell.

---

## 8. Semantic Commits Strategy

All commits follow Conventional Commits. Commits are atomic — one responsibility per commit. Format: `type(scope): description` in English.

| Type | When to use |
|------|-------------|
| `feat` | New feature or service |
| `fix` | Bug fix |
| `test` | Adding or fixing tests |
| `refactor` | Structural changes without behavior change |
| `docs` | README, comments, documentation |
| `chore` | Setup, config, tooling |

Examples:
```
feat(title-service): add title generation via OpenRouter
test(title-service): add unit tests for title parsing
chore(backend): initialize Express + TypeScript project
docs(readme): add architecture overview and setup guide
```

**Pre-commit gate:** no commit proceeds unless `npm test`, `npm run lint`, and `npm run typecheck` all pass. Enforced via `lefthook` or `husky`.

---

## 9. TDD Strategy

Every feature follows the Red-Green-Refactor cycle:
1. Write the failing test describing the expected behavior
2. Run it — confirm it fails with the right error (not a syntax error)
3. Write the minimum implementation to make it pass
4. Run tests — confirm green
5. Refactor if needed
6. Commit

Services are tested with mocked external dependencies (OpenRouter, Pexels API, `child_process` for Piper, `fluent-ffmpeg`). Integration tests use a real in-memory SQLite DB and a real Express app instance, but mock all external HTTP calls with `nock`.

---

## 10. Recommended Stack

| Concern | Choice | Reason |
|---------|--------|--------|
| Backend runtime | Node.js 20 LTS | Stable, async-first |
| Language | TypeScript 5 | Type safety, DX |
| HTTP framework | Express 4 | Simple, well-known, SSE support |
| Frontend | Next.js 14 App Router | Modern React, file-based routing, SSR |
| CSS | Tailwind CSS 3 | Utility-first, configurable with design tokens |
| ORM | Drizzle ORM | TypeScript-first, SQL-like, lightweight |
| Database | SQLite (better-sqlite3) | Zero-config, file-based, fast for V1 |
| LLM | OpenRouter via OpenAI SDK | Compatible API, access to multiple models |
| TTS | Piper (local Python) | Brazilian Portuguese, offline, free |
| Video | fluent-ffmpeg | Node.js wrapper for FFmpeg, chainable API |
| Asset search | Pexels API | Free tier, images + videos, commercial license |
| Logger | Pino | JSON-structured, fast, child loggers |
| Testing backend | Jest + ts-jest + Supertest | Standard, good TypeScript support |
| Testing frontend | Jest + React Testing Library | Standard, component-focused |
| HTTP mocking | nock | Clean integration test mocking |
| ID generation | nanoid | Small, URL-safe, fast |
| Env validation | zod | Parse and validate `process.env` at startup |

---

## 11. Folder Structure

```
omnigen-v2/
├── package.json                    # pnpm workspace root
├── pnpm-workspace.yaml
├── .gitignore
├── README.md
├── DESIGN.md
│
├── backend/
│   ├── src/
│   │   ├── config.ts               # zod-validated env config
│   │   ├── server.ts               # Express app factory + listen
│   │   ├── routes/
│   │   │   ├── generation.ts       # POST /start, GET /:id/stream, POST /:id/select-title
│   │   │   ├── history.ts          # GET /api/history, GET /api/history/:id
│   │   │   └── logs.ts             # GET /api/logs, POST /api/logs (frontend logs)
│   │   ├── services/
│   │   │   ├── title.service.ts    # LLM → 3 title suggestions
│   │   │   ├── script.service.ts   # LLM → full scene-based script
│   │   │   ├── asset-search.service.ts  # Pexels search → URLs
│   │   │   ├── asset-download.service.ts # download + normalize assets
│   │   │   ├── tts.service.ts      # Piper TTS → .wav file
│   │   │   ├── subtitle.service.ts # script → .srt file
│   │   │   ├── render.service.ts   # FFmpeg → final video
│   │   │   ├── thumbnail.service.ts # FFmpeg → 3 thumbnail frames
│   │   │   ├── tags.service.ts     # LLM → 10 tags
│   │   │   ├── description.service.ts # LLM → SEO description
│   │   │   └── pipeline.service.ts # orchestrates all steps with emit()
│   │   ├── db/
│   │   │   ├── index.ts            # Drizzle connection
│   │   │   ├── schema.ts           # Table definitions
│   │   │   └── migrate.ts          # run migrations at startup
│   │   ├── lib/
│   │   │   ├── openrouter.ts       # OpenAI SDK client (OpenRouter base URL)
│   │   │   ├── piper.ts            # executes python -m piper ...
│   │   │   ├── ffmpeg.ts           # fluent-ffmpeg wrapper helpers
│   │   │   ├── logger.ts           # Pino root logger + child factory
│   │   │   └── sse.ts              # SSE response helpers
│   │   └── types/
│   │       └── index.ts            # shared TS types (ProgressEvent, Generation, etc.)
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── title.service.test.ts
│   │   │   ├── script.service.test.ts
│   │   │   ├── asset-search.service.test.ts
│   │   │   ├── asset-download.service.test.ts
│   │   │   ├── tts.service.test.ts
│   │   │   ├── subtitle.service.test.ts
│   │   │   ├── render.service.test.ts
│   │   │   ├── thumbnail.service.test.ts
│   │   │   ├── tags.service.test.ts
│   │   │   ├── description.service.test.ts
│   │   │   └── pipeline.service.test.ts
│   │   └── integration/
│   │       ├── generation.route.test.ts
│   │       ├── history.route.test.ts
│   │       └── logs.route.test.ts
│   ├── prompts_templates/          # existing — do not move
│   │   ├── text_templates/
│   │   │   ├── title_generation_template.txt
│   │   │   ├── short_template.txt
│   │   │   ├── long_template.txt
│   │   │   ├── tags_template.txt
│   │   │   └── description_template.txt
│   │   ├── image_templates/
│   │   │   └── query_enrichment.txt
│   │   ├── video_templates/
│   │   │   └── query_enrichment.txt
│   │   └── tts_templates/
│   │       └── piper_config.txt
│   ├── storage/
│   │   ├── output/                 # final videos, thumbnails (gitignored)
│   │   ├── temp/                   # intermediate files (gitignored)
│   │   └── .gitkeep
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.ts
│   ├── .env                        # gitignored
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx          # Root layout: TabNav + font import
    │   │   ├── page.tsx            # Tab 1: Generation flow
    │   │   ├── history/
    │   │   │   └── page.tsx        # Tab 2: Past generations
    │   │   └── logs/
    │   │       └── page.tsx        # Tab 3: Log viewer
    │   ├── components/
    │   │   ├── GenerationForm.tsx  # theme input + video type selector + submit
    │   │   ├── TitlePicker.tsx     # 3 title cards → user picks one
    │   │   ├── ProgressBar.tsx     # step list + progress percentage
    │   │   ├── ResultPanel.tsx     # video player + thumbnails + tags + description
    │   │   ├── HistoryList.tsx     # paginated list of past generations
    │   │   ├── LogViewer.tsx       # real-time log stream with search + filter
    │   │   └── ui/
    │   │       ├── Button.tsx
    │   │       ├── Badge.tsx
    │   │       └── TabNav.tsx
    │   ├── hooks/
    │   │   ├── useSSE.ts           # EventSource wrapper with step state
    │   │   └── useLogs.ts          # polling or SSE for log stream
    │   ├── lib/
    │   │   ├── api.ts              # typed fetch wrappers for all backend endpoints
    │   │   └── logger.ts           # frontend logger (sends to POST /api/logs)
    │   └── types/
    │       └── index.ts            # mirrors backend types (shared manually or via package)
    ├── __tests__/
    │   ├── components/
    │   │   ├── GenerationForm.test.tsx
    │   │   ├── TitlePicker.test.tsx
    │   │   ├── ProgressBar.test.tsx
    │   │   └── ResultPanel.test.tsx
    │   └── hooks/
    │       └── useSSE.test.ts
    ├── public/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    └── jest.config.ts
```

---

## 12. Backend Architecture

The backend is a single Express process. Routes delegate immediately to the pipeline service. No controllers, no dependency injection framework — plain functions and dependency injection via function parameters.

**App composition** (`server.ts`):
```
createApp() → applies middleware (cors, json, pino-http) → registers routes → returns app
listen() → starts HTTP server on PORT
```

**Error handling:** A global Express error handler catches any unhandled thrown errors. SSE routes catch errors inside the async pipeline and emit an `error` SSE event before closing the stream.

---

## 13. Frontend Architecture

Next.js App Router. Three top-level routes: `/` (generation), `/history`, `/logs`. A shared `layout.tsx` renders the `TabNav` component that highlights the active tab.

The generation flow is a state machine managed by a single `useState` in `page.tsx`:
```
idle → generating_titles → awaiting_title_selection → generating_content → completed | error
```

SSE is consumed in `useSSE` hook. All API calls go through `src/lib/api.ts` (typed fetch wrappers). No global state manager (Zustand/Redux) — React state is sufficient for V1.

---

## 14. Logging Architecture

**Backend:** Pino root logger created in `lib/logger.ts`. Child loggers created per-request with `{ requestId, generationId }` context. All services receive a child logger. Logs are written to stdout as JSON.

Log levels: `error`, `warn`, `info`, `debug`.

**DB logging:** A Pino transport also writes logs to the `logs` table in SQLite. This enables the frontend Logs tab to query recent logs via `GET /api/logs`.

**Frontend:** `src/lib/logger.ts` captures frontend events and POSTs them to `POST /api/logs` with `source: 'frontend'`. The LogViewer page polls `GET /api/logs` and supports filtering by level and source.

---

## 15. Database Schema

```sql
-- generations table
CREATE TABLE generations (
  id TEXT PRIMARY KEY,                -- nanoid
  theme TEXT NOT NULL,
  video_type TEXT NOT NULL,           -- 'short' | 'long'
  suggested_titles TEXT,              -- JSON: string[]
  selected_title TEXT,
  script TEXT,
  assets_json TEXT,                   -- JSON: AssetRecord[]
  tts_path TEXT,
  subtitle_path TEXT,
  video_path TEXT,
  thumbnails_json TEXT,               -- JSON: string[]
  tags TEXT,                          -- JSON: string[]
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'pending_title_selection' | 'processing' | 'completed' | 'failed'
  error TEXT,
  created_at INTEGER NOT NULL,        -- Unix timestamp ms
  updated_at INTEGER NOT NULL
);

-- logs table
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,                -- 'info' | 'warn' | 'error' | 'debug'
  message TEXT NOT NULL,
  source TEXT NOT NULL,               -- 'backend' | 'frontend'
  context_json TEXT,                  -- JSON: arbitrary metadata
  created_at INTEGER NOT NULL
);
```

**Migrations:** Drizzle Kit manages migrations. `migrate.ts` runs `migrate(db, { migrationsFolder: './drizzle' })` at server startup. No manual SQL files needed.

---

## 16. Generation Pipeline

```
theme + videoType
  → [titleService]       LLM call with title_generation_template.txt
  ← 3 title strings
  → [user selects title]
  → [scriptService]      LLM call with short_template.txt OR long_template.txt
  ← scene array [{sceneId, description, narration}]
  → [assetSearchService] Pexels search per scene (images + videos)
  ← asset URLs per scene
  → [assetDownloadService] download + normalize to target resolution
  ← local file paths
  → [ttsService]         Piper: full narration text → .wav
  ← wav file path
  → [subtitleService]    script narration → timed .srt (word-count timing estimate)
  ← srt file path
  → [renderService]      FFmpeg: compose video with assets + audio + subtitles
  ← video file path
  → [thumbnailService]   FFmpeg: extract 3 frames at 10%, 50%, 90%
  ← [thumb1.jpg, thumb2.jpg, thumb3.jpg]
  → [tagsService]        LLM call with tags_template.txt
  ← 10 tags
  → [descriptionService] LLM call with description_template.txt
  ← description string
  → [db.save()]          update generation record with all results
  → emit 'completed'
```

---

## 17. Asset Search Pipeline

**Image search:** `GET https://api.pexels.com/v1/search?query={sceneDescription}&per_page=1&orientation={portrait|landscape}` — one image per scene. For short videos (9:16): `orientation=portrait`. For long videos (16:9): `orientation=landscape`.

**Video search:** `GET https://api.pexels.com/videos/search?query={sceneDescription}&per_page=1` — optional video overlay per scene. Videos are prioritized; if none found, image is used.

**Download:** Assets saved to `storage/temp/{generationId}/assets/`. Normalized via FFmpeg to target resolution before composition.

**Target resolutions:**
- Short (9:16): 1080×1920
- Long (16:9): 1920×1080

---

## 18. TTS Pipeline

Command contract (from spec):
```bash
python -m piper -m {model_path} -f {output_file}.wav -- '{narration_text}'
```

Model: `pt_BR-faber-medium.onnx` (already present in `backend/`).

Implementation: `lib/piper.ts` wraps `child_process.execFile` around the Python command. The narration text is the concatenation of all scene narration blocks from the script. Output: `storage/temp/{generationId}/narration.wav`.

---

## 19. Rendering Pipeline

**Short video (9:16, 45–60s):**
- Resolution: 1080×1920
- Each scene gets `duration = total_tts_duration / scene_count` seconds
- Asset scaled + cropped to fill 1080×1920 (object-fit: cover)
- Narration audio mixed in
- Subtitles burned in with FFmpeg `subtitles` filter
- Output: `storage/output/{generationId}/video.mp4`

**Long video (16:9, 10–12min):**
- Resolution: 1920×1080
- Same logic, different aspect ratio + longer total duration
- Output: same path pattern

**FFmpeg command outline (fluent-ffmpeg):**
```
ffmpeg
  -loop 1 -i scene1.jpg -t {duration}
  -loop 1 -i scene2.jpg -t {duration}
  ...
  -i narration.wav
  -filter_complex "[0:v]scale=1080:1920,setsar=1[v0];[1:v]scale=1080:1920,setsar=1[v1];...;[v0][v1]concat=n=N:v=1:a=0[outv]"
  -map "[outv]" -map {audioIndex}:a
  -vf "subtitles=subtitles.srt"
  -c:v libx264 -c:a aac -shortest
  output.mp4
```

**Thumbnails:** Extract frames at 10%, 50%, 90% of video duration via `ffmpeg -ss {time} -i video.mp4 -frames:v 1 thumb{n}.jpg`.

---

## 20. Short vs Long Video Strategy

| Property | Short | Long |
|----------|-------|------|
| Aspect ratio | 9:16 | 16:9 |
| Duration | 45–60s | 10–12min |
| Scenes | 5–8 | 25–30 |
| Script template | `short_template.txt` | `long_template.txt` |
| Pexels orientation | portrait | landscape |
| Output resolution | 1080×1920 | 1920×1080 |
| Subtitle font size | 48px | 32px |

---

## 21. Template System

Templates live in `backend/prompts_templates/` (existing structure). They are loaded at startup by each service and cached in memory. Template variables use `{{variable_name}}` syntax. A `loadTemplate(templatePath)` utility reads the file and returns a `fill(vars)` function that replaces all `{{key}}` placeholders.

---

## 22. History Strategy

Every generation (including failed ones) is persisted to the `generations` table. The History tab (`/history`) fetches `GET /api/history?page=1&limit=20` which returns paginated generation records ordered by `created_at DESC`. Clicking a completed generation shows the result panel inline. Failed generations show the error and a retry button that calls `POST /api/generation/retry/:id` (re-runs pipeline with same theme + title).

---

## 23–28. Local Setup & Configuration

### Prerequisites
- Node.js 20 LTS
- pnpm 9+
- Python 3.9+ with `piper-tts` installed: `pip install piper-tts`
- FFmpeg 6+ in PATH
- Pexels API key (free at pexels.com/api)
- OpenRouter API key (openrouter.ai)

### Environment Variables (`backend/.env.example`)
```env
PORT=3001
NODE_ENV=development

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o-mini

PIPER_MODEL_PATH=./pt_BR-faber-medium.onnx
FFMPEG_PATH=ffmpeg

PEXELS_API_KEY=your_pexels_api_key

DATABASE_URL=./storage/omnigen.db
STORAGE_PATH=./storage
PROMPTS_PATH=./prompts_templates
```

### Running locally
```bash
# Install dependencies
pnpm install

# Start backend (dev with watch)
pnpm --filter omnigen-backend dev

# Start frontend (dev)
pnpm --filter omnigen-frontend dev
```

### Piper setup
```bash
pip install piper-tts
# Model already present at backend/pt_BR-faber-medium.onnx
# Test: echo "Olá mundo" | python -m piper -m backend/pt_BR-faber-medium.onnx -f /tmp/test.wav
```

### FFmpeg setup
```bash
# Windows: winget install Gyan.FFmpeg
# macOS: brew install ffmpeg
# Verify: ffmpeg -version
```

### SQLite setup
- No installation needed — `better-sqlite3` is a Node.js native module
- DB file auto-created at `backend/storage/omnigen.db` on first run
- Drizzle Kit for migrations: `pnpm --filter omnigen-backend db:migrate`

---

## 29. Testing Strategy

**Unit tests** — each service tested in isolation. External dependencies (OpenRouter, Pexels, Piper, FFmpeg) are mocked with Jest mocks. Tests validate:
- Correct prompt interpolation
- Correct parsing of LLM responses (extract 3 titles from raw text)
- Error propagation when external calls fail
- File path construction

**Integration tests** — full Express app with in-memory SQLite. External HTTP calls mocked with `nock`. Tests validate:
- Full request/response cycle for each route
- SSE event stream sequence
- DB state after pipeline completion
- Error recovery

**Frontend tests** — React Testing Library. Components tested in isolation with mocked API responses. SSE tested via mocked `EventSource`. Tests validate:
- Form submission triggers correct API calls
- Progress bar updates on SSE events
- Title picker calls select-title endpoint
- Result panel renders video + thumbnails

**Coverage target:** ≥80% for services and routes.

---

## 30. Technical Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Piper requires Python env setup | High | Document precisely; test early in Task 13 |
| FFmpeg scene concatenation timing drift | Medium | Calculate durations from TTS wav length (ffprobe) |
| Pexels API rate limits (200 req/hour free) | Medium | Cache nothing but limit 1 req/scene; short video = 8 max |
| Long video FFmpeg RAM usage (30 scenes) | Medium | Use concat demuxer (file list) instead of filter_complex |
| OpenRouter LLM output format variance | Medium | Robust parsing with fallback; test edge cases |
| SSE connection dropped mid-pipeline | Low | Client auto-reconnects; backend resumes via DB state |
| Windows path issues in Piper command | Medium | Use `path.resolve()` everywhere; test on Windows early |

---

## 31. Roadmap by Phase

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1–4 | Project setup: monorepo, backend scaffold, frontend scaffold, DB |
| 2 | 5–8 | Core infrastructure: config, logger, OpenRouter client, shared types |
| 3 | 9–16 | Pipeline services part 1: title, script, asset-search, asset-download, TTS, subtitle |
| 4 | 17–23 | Pipeline services part 2: render, thumbnail, tags, description, pipeline orchestrator, SSE |
| 5 | 24–31 | API routes + frontend core: all routes, design system, layout, form, progress bar, hooks |
| 6 | 32–39 | Frontend completion: title picker, result panel, history, logs, README, integration |

---

*Continue to `PLAN_1_PART_2.md` for Tasks 1–8.*
