import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { getDb } from '../db'
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
    const errorMsg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return res.status(400).json({ error: errorMsg })
  }

  const { theme, videoType } = parsed.data
  const generationId = randomUUID()
  const now = Date.now()

  try {
    const titles = await generateTitles(theme, videoType as VideoType)

    await getDb().insert(generations).values({
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

  const db = getDb()
  const rows = await db.select().from(generations).where(eq(generations.id, id)).limit(1)
  const generation = rows[0]

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
  const db = getDb()

  const rows = await db.select().from(generations).where(eq(generations.id, id)).limit(1)
  const generation = rows[0]

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
