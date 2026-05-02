import { postFrontendLog } from './api'

type Level = 'info' | 'warn' | 'error' | 'debug'

async function log(level: Level, message: string, context?: Record<string, unknown>) {
  try {
    await postFrontendLog(level, message, context)
  } catch {
    // silently fail — never let logging break the UI
  }
}

export const frontendLogger = {
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
}
