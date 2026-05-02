import express from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import { logger } from './lib/logger'
import { initDb } from './db'
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
  const PORT = parseInt(process.env.PORT ?? '3001', 10)
  initDb(process.env.DATABASE_URL ?? './storage/omnigen.db')
  const app = createApp()
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'server started')
  })
}
