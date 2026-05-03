# Omnigen

> Automated video generation powered by AI — from a topic to a complete video in minutes.

## Overview

Omnigen is a fullstack web application that takes a **topic** and a **video format** (short or long) and generates a complete video automatically:

- **Script** written by an LLM via OpenRouter
- **Narration** synthesized locally with Piper TTS (Brazilian Portuguese)
- **Images and video clips** sourced from Google via SerpAPI, with LLM-optimised search queries
- **Video clips** downloaded from YouTube/Vimeo with yt-dlp, trimmed to exact scene duration
- **Final video** composed with FFmpeg (1080p, CRF 18, burned-in subtitles)
- **Thumbnails**, **tags**, and **SEO description** generated automatically

The entire pipeline runs synchronously with real-time progress streamed to the browser via SSE.

---

## Architecture

```
Browser (Next.js)
  └─ POST /api/generation/start          → title generation
  └─ POST /api/generation/:id/select-title → title selection
  └─ GET  /api/generation/:id/stream     → SSE pipeline progress

Express Backend (port 3001)
  └─ Pipeline (linear, no queues)
       title → script → search images → search videos → download assets
       → TTS → subtitles → render (FFmpeg) → thumbnails → tags → description

SQLite (Drizzle ORM) — generations + logs tables
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20 + TypeScript + Express |
| Frontend | Next.js 14 App Router + Tailwind CSS |
| Database | SQLite + Drizzle ORM |
| LLM | OpenRouter (OpenAI-compatible API) |
| TTS | Piper (local, Brazilian Portuguese) |
| Video | FFmpeg via fluent-ffmpeg |
| Assets | SerpAPI (Google Images + Google Videos) |
| Video download | yt-dlp (YouTube, Vimeo, and direct .mp4 URLs) |
| Logger | Pino (JSON structured) |
| Tests | Jest + Supertest (backend), RTL (frontend) |

---

## Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **Python** 3.9+ with the following packages:
  ```bash
  pip install piper-tts yt-dlp
  ```
- **FFmpeg** 6+ in PATH (required by both yt-dlp merging and render)
  - Windows: `winget install Gyan.FFmpeg`
  - macOS: `brew install ffmpeg`
- **OpenRouter API key** — [openrouter.ai](https://openrouter.ai)
- **SerpAPI key** — [serpapi.com](https://serpapi.com) (free tier: 100 searches/month)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd omnigen-v2
pnpm install
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_key_here
SERPAPI_KEY=your_serpapi_key_here
```

### 3. Run database migrations

```bash
pnpm --filter omnigen-backend db:generate
pnpm --filter omnigen-backend db:migrate
```

### 4. Start development servers

```bash
# Terminal 1 — backend (port 3001)
pnpm --filter omnigen-backend dev

# Terminal 2 — frontend (port 3000)
pnpm --filter omnigen-frontend dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running Tests

```bash
# All tests
pnpm test

# Backend only
pnpm --filter omnigen-backend test

# Frontend only
pnpm --filter omnigen-frontend test

# With coverage
pnpm --filter omnigen-backend test:coverage
```

---

## Folder Structure

```
omnigen-v2/
├── backend/
│   ├── src/
│   │   ├── config.ts            # zod env validation
│   │   ├── server.ts            # Express app
│   │   ├── routes/              # generation, history, logs
│   │   ├── services/            # one file per pipeline step
│   │   ├── db/                  # Drizzle schema + connection
│   │   └── lib/                 # openrouter, google-search, piper, ffmpeg, sse, logger
│   ├── prompts_templates/       # LLM prompt templates
│   ├── storage/                 # generated files (gitignored)
│   └── tests/                   # unit + integration
└── frontend/
    └── src/
        ├── app/                 # Next.js routes (/, /history, /logs)
        ├── components/          # UI components
        ├── hooks/               # useSSE
        ├── lib/                 # api client, logger
        └── types/               # shared TypeScript types
```

---

## Application Flow

1. User enters a **topic** and selects **video type** (short/long)
2. System generates **3 title suggestions** via LLM
3. User selects one title
4. System runs the full pipeline with real-time progress:
   - Generates script (LLM) — scenes with descriptions and narration text
   - Translates each scene description into an English stock-footage query (LLM)
   - Searches images and videos on Google via SerpAPI, filtering to ≥720p
   - Downloads assets: video clips via yt-dlp (trimmed to scene duration), images via HTTPS with redirect following
   - Synthesizes narration (Piper TTS, per scene then concatenated)
   - Generates subtitles (.srt)
   - Renders final video (FFmpeg): scale/crop to target resolution, burned-in subtitles, CRF 18
   - Extracts 3 thumbnails (at 10%, 50%, 90% of duration)
   - Generates tags and SEO description (LLM)
5. User receives: video, thumbnails, script, tags, description

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `openai/gpt-4o-mini` | LLM model to use |
| `SERPAPI_KEY` | Yes | — | SerpAPI key for Google image/video search |
| `PIPER_MODEL_PATH` | No | `./pt_BR-faber-medium.onnx` | Piper TTS model path |
| `FFMPEG_PATH` | No | `ffmpeg` | FFmpeg binary path |
| `PORT` | No | `3001` | Backend port |
| `DATABASE_URL` | No | `./storage/omnigen.db` | SQLite file path |
| `STORAGE_PATH` | No | `./storage` | Root for temp and output files |
| `PROMPTS_PATH` | No | `./prompts_templates` | LLM prompt templates directory |

---

## Asset Pipeline Detail

### Search
Each scene description is sent to the LLM to produce a concise 2–4 word English search query (e.g. "futuristic city skyline"). This query is used to search Google Images and Google Videos via SerpAPI. Images must be at least 1280×720; videos must be at most 1080p height. Videos are preferred — images are used only as fallback.

### Download
- **Direct `.mp4` URLs** — streamed via ffmpeg with a `-t` time limit
- **YouTube / Vimeo URLs** — downloaded with yt-dlp using `--download-sections` for a partial fetch first; if that fails, yt-dlp downloads the full video and ffmpeg trims it
- **Images** — downloaded over HTTPS with automatic redirect following (up to 5 hops) and empty-body detection

### Video trimming
Before concatenation, each video clip is re-encoded to the exact scene duration using `libx264 ultrafast + aac`. This is necessary because:
- `inpoint`/`outpoint` in the ffmpeg concat demuxer collapses all clips to the same timestamp range when every source clip starts at `0`
- `-c copy` (stream copy) fails for VP9/AV1 content which cannot be muxed into `.mp4` without re-encoding

### Render quality
| Setting | Value | Reason |
|---------|-------|--------|
| Video codec | libx264, CRF 18 | Near-lossless, universally compatible |
| Preset | fast | Good quality/speed balance |
| Audio | aac, 192k | Broadcast standard quality |
| Container flags | +faststart | Enables streaming before full download |
| Subtitle style | Arial 22px, bold, white + black outline | Readable on any background |

---

## Technical Decisions

- **Synchronous pipeline** — simplicity, predictability, easy debugging. No queues or workers in V1.
- **SSE over WebSockets** — one-way progress stream is sufficient; no bidirectional communication needed.
- **Piper TTS** — fully offline, no API costs, native Brazilian Portuguese support.
- **SerpAPI + Google** — broader, more contextually relevant results than stock-photo APIs. Free tier covers development/demo usage.
- **yt-dlp for video** — handles authentication, format selection, and partial downloads across all major platforms.
- **libx264 ultrafast pre-trim** — avoids codec incompatibility and the concat demuxer timestamp collapse bug.
- **Drizzle ORM** — TypeScript-first, SQL-like, no magic, zero-config migrations.
- **SQLite** — zero-config, single-file, sufficient for V1 local usage.

---

## Conventions

- All code in **English** (variables, functions, types, comments, commits)
- All user-facing text in **Portuguese (pt-BR)**
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
- TDD: write test → fail → implement → pass → commit
- No commit without passing tests + lint + typecheck
