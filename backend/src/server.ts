import express from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import path from 'path'
import { logger } from './lib/logger'
import { generationRouter } from './routes/generation'
import { historyRouter } from './routes/history'
import { logsRouter } from './routes/logs'
import { config } from './config'

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

  app.use('/output', express.static(path.join(config.STORAGE_PATH, 'output')))

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'unhandled error')
    res.status(500).json({ error: err.message })
  })

  return app
}

if (require.main === module) {
  const app = createApp()
  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'server started')
  })
}
