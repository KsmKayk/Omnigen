import { Router, type Request, type Response } from 'express'
import { getDb } from '../db'
import { generations } from '../db/schema'
import { desc, eq } from 'drizzle-orm'

export const historyRouter = Router()

historyRouter.get('/', async (_req: Request, res: Response) => {
  const records = await getDb().select().from(generations).orderBy(desc(generations.createdAt)).limit(50)
  return res.json(records)
})

historyRouter.get('/:id', async (req: Request, res: Response) => {
  const rows = await getDb().select().from(generations).where(eq(generations.id, req.params.id)).limit(1)
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  return res.json(rows[0])
})
