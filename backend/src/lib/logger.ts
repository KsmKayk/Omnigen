import pino from 'pino'

const isTest = process.env.NODE_ENV === 'test'

export const logger = pino({
  level: isTest ? 'silent' : 'info',
})

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings)
}

export function persistLog(
  level: string,
  message: string,
  source: 'backend' | 'frontend',
  context?: Record<string, unknown>,
): void {
  if (isTest) return
  try {
    const { getDb } = require('../db')
    const { logs } = require('../db/schema')
    const db = getDb()
    db.insert(logs).values({
      level,
      message,
      source,
      contextJson: context ? JSON.stringify(context) : null,
      createdAt: Date.now(),
    }).run()
  } catch {
    // silently skip — never let logging break the app
  }
}
