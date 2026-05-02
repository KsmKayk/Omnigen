# Omnigen

> Automated video generation powered by AI — from a topic to a complete video in minutes.

## Overview

Omnigen is a fullstack web application that takes a **topic** and a **video format** (short or long) and generates a complete video automatically:

- **Script** written by an LLM via OpenRouter
- **Narration** synthesized locally with Piper TTS (Brazilian Portuguese)
- **Images and video clips** sourced from Pexels
- **Final video** composed with FFmpeg
- **Thumbnails**, **tags**, and **SEO description** generated automatically

The entire pipeline runs synchronously with real-time progress streamed to the browser via SSE.

---

## Architecture

```
Browser (Next.js)
  └─ POST /api/generation/start       → title generation
  └─ POST /api/generation/:id/select  → title selection
  └─ GET  /api/generation/:id/stream  → SSE pipeline progress

Express Backend (port 3001)
  └─ Pipeline (linear, no queues)
       title → script → assets → TTS → subtitles
       → render (FFmpeg) → thumbnails → tags → description

SQLite (Drizzle ORM) — generations + logs tables
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20 + TypeScript + Express |
| Frontend | Next.js 14 App Router + Tailwind CSS |
| Database | SQLite + Drizzle ORM |
| LLM | OpenRouter (OpenAI-compatible API) |
| TTS | Piper (local, Brazilian Portuguese) |
| Video | FFmpeg via fluent-ffmpeg |
| Assets | Pexels API |
| Logger | Pino (JSON structured) |
| Tests | Jest + Supertest (backend), RTL (frontend) |

---

## Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **Python** 3.9+ with `piper-tts`: `pip install piper-tts`
- **FFmpeg** 6+ in PATH
  - Windows: `winget install Gyan.FFmpeg`
  - macOS: `brew install ffmpeg`
- **OpenRouter API key** — [openrouter.ai](https://openrouter.ai)
- **Pexels API key** — [pexels.com/api](https://www.pexels.com/api/)

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
OPENROUTER_API_KEY=your_key_here
PEXELS_API_KEY=your_key_here
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
│   │   └── lib/                 # openrouter, piper, ffmpeg, sse, logger
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
   - Generates script (LLM)
   - Searches images/videos (Pexels)
   - Downloads assets
   - Synthesizes narration (Piper TTS)
   - Generates subtitles (.srt)
   - Renders final video (FFmpeg)
   - Extracts thumbnails
   - Generates tags and description (LLM)
5. User receives: video, thumbnails, script, tags, description

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `openai/gpt-4o-mini` | LLM model to use |
| `PEXELS_API_KEY` | Yes | — | Pexels API key |
| `PIPER_MODEL_PATH` | No | `./pt_BR-faber-medium.onnx` | Piper model path |
| `FFMPEG_PATH` | No | `ffmpeg` | FFmpeg binary path |
| `PORT` | No | `3001` | Backend port |
| `DATABASE_URL` | No | `./storage/omnigen.db` | SQLite file path |

---

## Technical Decisions

- **Synchronous pipeline** — simplicity, predictability, easy debugging. No queues or workers in V1.
- **SSE over WebSockets** — one-way progress stream is sufficient; no bidirectional communication needed.
- **Piper TTS** — fully offline, no API costs, native Brazilian Portuguese support.
- **Pexels API** — free tier (200 req/hour), high quality, commercial license.
- **Drizzle ORM** — TypeScript-first, SQL-like, no magic, zero-config migrations.
- **SQLite** — zero-config, single-file, sufficient for V1 local usage.

---

## Conventions

- All code in **English** (variables, functions, types, comments, commits)
- All user-facing text in **Portuguese (pt-BR)**
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
- TDD: write test → fail → implement → pass → commit
- No commit without passing tests + lint + typecheck
