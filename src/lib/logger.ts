// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  userId?: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: Error | string;
}

// Environment configuration
const isDev = process.env.NODE_ENV === 'development';
const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;

// Priority levels for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Structured logger that can be easily replaced with a more sophisticated solution
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[logLevel];
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, userId, context, data, error } = entry;
    
    // Format the basic log entry
    let logString = `${timestamp} [${level.toUpperCase()}]`;
    
    // Add context and user ID if available
    if (context) logString += ` [${context}]`;
    if (userId) logString += ` [User: ${userId}]`;
    
    // Add the message
    logString += `: ${message}`;
    
    // In development, add detailed data and error info
    if (isDev) {
      if (data) logString += `\nData: ${JSON.stringify(data, null, 2)}`;
      if (error) {
        if (error instanceof Error) {
          logString += `\nError: ${error.message}\nStack: ${error.stack}`;
        } else {
          logString += `\nError: ${error}`;
        }
      }
    }
    
    return logString;
  }

  private log(level: LogLevel, message: string, opts?: {
    userId?: string;
    context?: string;
    data?: Record<string, unknown>;
    error?: Error | string;
  }): void {
    if (!this.shouldLog(level)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...opts
    };
    
    const formatted = this.formatLog(entry);
    
    // Use console methods based on level
    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
    
    // In production, this could be extended to send logs to a service
    // e.g., Sentry, Datadog, or a custom logging endpoint
  }

  debug(message: string, opts?: {
    userId?: string;
    context?: string;
    data?: Record<string, unknown>;
  }): void {
    this.log('debug', message, opts);
  }

  info(message: string, opts?: {
    userId?: string;
    context?: string;
    data?: Record<string, unknown>;
  }): void {
    this.log('info', message, opts);
  }

  warn(message: string, opts?: {
    userId?: string;
    context?: string;
    data?: Record<string, unknown>;
    error?: Error | string;
  }): void {
    this.log('warn', message, opts);
  }

  error(message: string, opts?: {
    userId?: string;
    context?: string;
    data?: Record<string, unknown>;
    error?: Error | string;
  }): void {
    this.log('error', message, opts);
  }
}

// Export a singleton instance
export const logger = new Logger();