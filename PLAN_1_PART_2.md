# Omnigen — Tasks 1–8: Project Setup + Core Infrastructure

> **Prerequisite:** Read `PLAN_1.md` for architecture overview, strategies, and folder structure before executing these tasks.

---

### Task 1: Monorepo Root Setup

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`

- [ ] **Step 1: Create workspace root `package.json`**

```json
{
  "name": "omnigen",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter './backend' --filter './frontend' dev",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint",
    "typecheck": "pnpm --recursive typecheck"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'backend'
  - 'frontend'
```

- [ ] **Step 3: Create `.gitignore`**

```gitignore
node_modules/
dist/
.next/
.env
backend/storage/output/
backend/storage/temp/
backend/storage/omnigen.db
*.onnx
drizzle/
coverage/
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore
git commit -m "chore: initialize pnpm monorepo workspace"
```

---

### Task 2: Backend TypeScript + Express Scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/jest.config.ts`
- Create: `backend/src/server.ts`
- Create: `backend/.env.example`
- Create: `backend/storage/.gitkeep`

- [ ] **Step 1: Write failing test for server health check**

Create `backend/tests/integration/health.test.ts`:
```typescript
import request from 'supertest'
import { createApp } from '../../src/server'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const app = createApp()
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest tests/integration/health.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '../../src/server'`

- [ ] **Step 3: Create `backend/package.json`**

```json
{
  "name": "omnigen-backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "jest --runInBand --forceExit",
    "test:coverage": "jest --runInBand --forceExit --coverage",
    "lint": "eslint src tests --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "drizzle-orm": "^0.30.10",
    "express": "^4.19.2",
    "fluent-ffmpeg": "^2.1.3",
    "nanoid": "^5.0.7",
    "openai": "^4.47.1",
    "pino": "^9.1.0",
    "pino-http": "^10.2.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.10",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/fluent-ffmpeg": "^2.1.24",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.0",
    "@types/supertest": "^6.0.2",
    "drizzle-kit": "^0.21.4",
    "jest": "^29.7.0",
    "nock": "^13.5.4",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.5",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 4: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 5: Create `backend/jest.config.ts`**

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
}

export default config
```

- [ ] **Step 6: Create `backend/src/server.ts`**

```typescript
import express from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import { logger } from './lib/logger'
import { generationRouter } from './routes/generation'
import { historyRouter } from './routes/history'
import { logsRouter } from './routes/logs'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(pinoHttp({ logger }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/generation', generationRouter)
  app.use('/api/history', historyRouter)
  app.use('/api/logs', logsRouter)

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'unhandled error')
    res.status(500).json({ error: err.message })
  })

  return app
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { config } = require('./config')
  const app = createApp()
  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'server started')
  })
}
```

- [ ] **Step 7: Create `backend/.env.example`**

```env
PORT=3001
NODE_ENV=development

OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o-mini

PIPER_MODEL_PATH=./pt_BR-faber-medium.onnx
FFMPEG_PATH=ffmpeg

PEXELS_API_KEY=your_pexels_api_key_here

DATABASE_URL=./storage/omnigen.db
STORAGE_PATH=./storage
PROMPTS_PATH=./prompts_templates
```

- [ ] **Step 8: Install deps and run test**

```bash
cd backend && pnpm install
pnpm test tests/integration/health.test.ts
```
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add backend/
git commit -m "chore(backend): scaffold Express + TypeScript project"
```

---

### Task 3: Frontend Next.js Scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/jest.config.ts`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`

- [ ] **Step 1: Write failing test for root page render**

Create `frontend/__tests__/app/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Home from '../../src/app/page'

describe('Home page', () => {
  it('renders the Omnigen heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /omnigen/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx jest __tests__/app/page.test.tsx --no-coverage
```
Expected: FAIL — `Cannot find module '../../src/app/page'`

- [ ] **Step 3: Create `frontend/package.json`**

```json
{
  "name": "omnigen-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "ts-jest": "^29.1.5",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 4: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `frontend/next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ]
  },
}

export default config
```

- [ ] **Step 6: Create `frontend/jest.config.ts`**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
}

export default createJestConfig(config)
```

Create `frontend/jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create `frontend/src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import '../styles/globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
})

export const metadata: Metadata = {
  title: 'Omnigen',
  description: 'Geração automatizada de vídeos com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={ibmPlexSans.variable}>
      <body className="bg-white text-near-black font-ui antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Create `frontend/src/app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen">
      <h1 className="text-4xl font-bold tracking-tight text-center pt-16">
        Omnigen
      </h1>
    </main>
  )
}
```

- [ ] **Step 9: Install deps and run test**

```bash
cd frontend && pnpm install
pnpm test __tests__/app/page.test.tsx
```
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "chore(frontend): scaffold Next.js 14 project with Tailwind"
```

---

### Task 4: Database Setup (Drizzle + SQLite)

**Files:**
- Create: `backend/src/db/schema.ts`
- Create: `backend/src/db/index.ts`
- Create: `backend/src/db/migrate.ts`

- [ ] **Step 1: Write failing test for DB schema**

Create `backend/tests/unit/db.test.ts`:
```typescript
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../../src/db/schema'
import path from 'path'

describe('database schema', () => {
  it('creates generations and logs tables', () => {
    const sqlite = new Database(':memory:')
    const db = drizzle(sqlite, { schema })
    migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') })

    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[]

    const names = tables.map((t) => t.name)
    expect(names).toContain('generations')
    expect(names).toContain('logs')
    sqlite.close()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/db.test.ts
```
Expected: FAIL — `Cannot find module '../../src/db/schema'`

- [ ] **Step 3: Create `backend/src/db/schema.ts`**

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const generations = sqliteTable('generations', {
  id: text('id').primaryKey(),
  theme: text('theme').notNull(),
  videoType: text('video_type').notNull(),
  suggestedTitles: text('suggested_titles'),
  selectedTitle: text('selected_title'),
  script: text('script'),
  assetsJson: text('assets_json'),
  ttsPath: text('tts_path'),
  subtitlePath: text('subtitle_path'),
  videoPath: text('video_path'),
  thumbnailsJson: text('thumbnails_json'),
  tags: text('tags'),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  error: text('error'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: text('level').notNull(),
  message: text('message').notNull(),
  source: text('source').notNull(),
  contextJson: text('context_json'),
  createdAt: integer('created_at').notNull(),
})
```

- [ ] **Step 4: Create Drizzle config and generate migrations**

Create `backend/drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: './storage/omnigen.db' },
} satisfies Config
```

Add to `backend/package.json` scripts:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "ts-node src/db/migrate.ts"
```

Run migration generation:
```bash
cd backend && pnpm db:generate
```

- [ ] **Step 5: Create `backend/src/db/index.ts`**

```typescript
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import * as schema from './schema'
import { config } from '../config'

const sqlite = new Database(config.DATABASE_URL)
export const db = drizzle(sqlite, { schema })

export function runMigrations() {
  migrate(db, {
    migrationsFolder: path.join(__dirname, '../../drizzle'),
  })
}
```

- [ ] **Step 6: Create `backend/src/db/migrate.ts`**

```typescript
import { runMigrations } from '.'
import { logger } from '../lib/logger'

runMigrations()
logger.info('migrations applied')
```

- [ ] **Step 7: Run test**

```bash
cd backend && pnpm test tests/unit/db.test.ts
```
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/src/db/ backend/drizzle/ backend/drizzle.config.ts
git commit -m "feat(db): add Drizzle schema for generations and logs tables"
```

---

### Task 5: Shared TypeScript Types

**Files:**
- Create: `backend/src/types/index.ts`

- [ ] **Step 1: Write failing test for type exports**

Create `backend/tests/unit/types.test.ts`:
```typescript
import type { Generation, VideoType, PipelineStep, ProgressEvent, GenerationStatus } from '../../src/types'

describe('types', () => {
  it('VideoType accepts short and long', () => {
    const a: VideoType = 'short'
    const b: VideoType = 'long'
    expect(a).toBe('short')
    expect(b).toBe('long')
  })

  it('ProgressEvent has required fields', () => {
    const event: ProgressEvent = {
      step: 'script',
      status: 'processing',
      progress: 15,
      message: 'Gerando roteiro...',
    }
    expect(event.progress).toBe(15)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/types.test.ts
```
Expected: FAIL — `Cannot find module '../../src/types'`

- [ ] **Step 3: Create `backend/src/types/index.ts`**

```typescript
export type VideoType = 'short' | 'long'

export type GenerationStatus =
  | 'pending'
  | 'pending_title_selection'
  | 'processing'
  | 'completed'
  | 'failed'

export type PipelineStep =
  | 'titles'
  | 'script'
  | 'images'
  | 'videos'
  | 'tts'
  | 'subtitles'
  | 'render'
  | 'thumbnails'
  | 'tags'
  | 'description'
  | 'saving'
  | 'completed'

export interface ProgressEvent {
  step: PipelineStep
  status: 'processing' | 'done' | 'error'
  progress: number
  message?: string
  error?: string
}

export interface SceneBlock {
  sceneId: number
  description: string
  narration: string
}

export interface AssetRecord {
  sceneId: number
  type: 'image' | 'video'
  url: string
  localPath: string
  width: number
  height: number
}

export interface Generation {
  id: string
  theme: string
  videoType: VideoType
  suggestedTitles: string[] | null
  selectedTitle: string | null
  script: SceneBlock[] | null
  assets: AssetRecord[] | null
  ttsPath: string | null
  subtitlePath: string | null
  videoPath: string | null
  thumbnails: string[] | null
  tags: string[] | null
  description: string | null
  status: GenerationStatus
  error: string | null
  createdAt: number
  updatedAt: number
}

export interface GenerationResult {
  generationId: string
  title: string
  videoPath: string
  thumbnails: string[]
  script: SceneBlock[]
  tags: string[]
  description: string
}

export type EmitFn = (event: ProgressEvent) => void
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/types.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/types/
git commit -m "feat(types): add shared TypeScript types for pipeline"
```

---

### Task 6: Config Module

**Files:**
- Create: `backend/src/config.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/config.test.ts`:
```typescript
describe('config', () => {
  it('throws on missing OPENROUTER_API_KEY', () => {
    const saved = process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_API_KEY
    jest.resetModules()
    expect(() => require('../../src/config')).toThrow()
    process.env.OPENROUTER_API_KEY = saved ?? 'test'
    jest.resetModules()
  })

  it('parses PORT as number', () => {
    process.env.PORT = '3001'
    process.env.OPENROUTER_API_KEY = 'test'
    process.env.PEXELS_API_KEY = 'test'
    jest.resetModules()
    const { config } = require('../../src/config')
    expect(typeof config.PORT).toBe('number')
    expect(config.PORT).toBe(3001)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/config.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/config.ts`**

```typescript
import { z } from 'zod'
import path from 'path'

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().default('openai/gpt-4o-mini'),

  PIPER_MODEL_PATH: z.string().default('./pt_BR-faber-medium.onnx'),
  FFMPEG_PATH: z.string().default('ffmpeg'),

  PEXELS_API_KEY: z.string().min(1),

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

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/config.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/config.ts
git commit -m "feat(config): add zod-validated environment config module"
```

---

### Task 7: Logger

**Files:**
- Create: `backend/src/lib/logger.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/logger.test.ts`:
```typescript
import { logger, createChildLogger } from '../../src/lib/logger'

describe('logger', () => {
  it('exports a pino logger instance', () => {
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('createChildLogger returns a child with extra bindings', () => {
    const child = createChildLogger({ generationId: 'abc123' })
    expect(typeof child.info).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/logger.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/lib/logger.ts`**

```typescript
import pino from 'pino'
import { db } from '../db'
import { logs } from '../db/schema'

const isTest = process.env.NODE_ENV === 'test'

export const logger = pino({
  level: isTest ? 'silent' : 'info',
  transport: isTest
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true } },
})

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings)
}

export function persistLog(
  level: string,
  message: string,
  source: 'backend' | 'frontend',
  context?: Record<string, unknown>,
) {
  try {
    db.insert(logs).values({
      level,
      message,
      source,
      contextJson: context ? JSON.stringify(context) : null,
      createdAt: Date.now(),
    }).run()
  } catch {
    // silently skip DB log errors to prevent cascading failures
  }
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/logger.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/logger.ts
git commit -m "feat(logger): add Pino logger with child logger factory and DB persistence"
```

---

### Task 8: OpenRouter Client

**Files:**
- Create: `backend/src/lib/openrouter.ts`

- [ ] **Step 1: Write failing test**

Create `backend/tests/unit/openrouter.test.ts`:
```typescript
import nock from 'nock'
import { callLLM } from '../../src/lib/openrouter'

process.env.OPENROUTER_API_KEY = 'test-key'
process.env.PEXELS_API_KEY = 'test-key'

describe('callLLM', () => {
  afterEach(() => nock.cleanAll())

  it('returns assistant message content', async () => {
    nock('https://openrouter.ai')
      .post('/api/v1/chat/completions')
      .reply(200, {
        choices: [{ message: { role: 'assistant', content: 'Hello world' } }],
      })

    const result = await callLLM('Say hello')
    expect(result).toBe('Hello world')
  })

  it('throws on empty choices', async () => {
    nock('https://openrouter.ai')
      .post('/api/v1/chat/completions')
      .reply(200, { choices: [] })

    await expect(callLLM('test')).rejects.toThrow('LLM returned empty response')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && pnpm test tests/unit/openrouter.test.ts
```
Expected: FAIL

- [ ] **Step 3: Create `backend/src/lib/openrouter.ts`**

```typescript
import OpenAI from 'openai'
import { config } from '../config'

const client = new OpenAI({
  apiKey: config.OPENROUTER_API_KEY,
  baseURL: config.OPENROUTER_BASE_URL,
})

export async function callLLM(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  const response = await client.chat.completions.create({
    model: config.OPENROUTER_MODEL,
    messages,
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('LLM returned empty response')
  }

  return content.trim()
}
```

- [ ] **Step 4: Run test**

```bash
cd backend && pnpm test tests/unit/openrouter.test.ts
```
Expected: PASS

- [ ] **Step 5: Run all backend tests to ensure no regressions**

```bash
cd backend && pnpm test
```
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/openrouter.ts
git commit -m "feat(openrouter): add OpenAI SDK client with OpenRouter base URL"
```

---

*Continue to `PLAN_1_PART_3.md` for Tasks 9–16: Generation Pipeline Services.*
