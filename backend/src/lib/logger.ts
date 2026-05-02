import pino from 'pino'

export const logger = pino({ level: process.env.NODE_ENV === 'test' ? 'silent' : 'info' })

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings)
}
