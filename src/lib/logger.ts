/**
 * Centralized logging utility
 * In development, logs to console
 * In production, can be extended to send logs to external service (Sentry, etc.)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = import.meta.env.DEV

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`

    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

      if (context) {
        consoleMethod(logMessage, context)
      } else {
        consoleMethod(logMessage)
      }
    } else {
      // In production, you can send logs to external service
      // Example: Sentry.captureMessage(message, { level, extra: context })
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    }
    this.log('error', message, errorContext)
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }
}

export const logger = new Logger()
