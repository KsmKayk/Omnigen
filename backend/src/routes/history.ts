import { Router, type Request, type Response } from 'express'
import { getDb } from '../db'
import { generations } from '../db/schema'
import { desc, eq } from 'drizzle-orm'
import { logger } from '../lib/logger'

export const historyRouter = Router()

historyRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const records = await getDb().select().from(generations).orderBy(desc(generations.createdAt)).limit(50)
    return res.json(records)
  } catch (err) {
    logger.error({ err }, 'failed to fetch history')
    return res.status(500).json({ error: (err as Error).message })
  }
})

historyRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const rows = await getDb().select().from(generations).where(eq(generations.id, req.params.id)).limit(1)
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    return res.json(rows[0])
  } catch (err) {
    logger.error({ err }, 'failed to fetch generation')
    return res.status(500).json({ error: (err as Error).message })
  }
})
