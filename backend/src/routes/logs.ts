import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { getDb } from '../db'
import { logs } from '../db/schema'
import { desc } from 'drizzle-orm'

export const logsRouter = Router()

logsRouter.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500)
  const records = await getDb().select().from(logs).orderBy(desc(logs.createdAt)).limit(limit)
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
  await getDb().insert(logs).values({
    level,
    message,
    source: 'frontend',
    contextJson: context ? JSON.stringify(context) : null,
    createdAt: Date.now(),
  })

  return res.status(201).json({ ok: true })
})
