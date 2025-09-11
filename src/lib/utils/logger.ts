/**
 * Structured Logging Utility
 * Provides consistent logging across the application with proper error handling
 */

import { getConfig, isProduction, isDevelopment } from '@/lib/config/env';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  worldId?: string;
  entityId?: string;
  templateId?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  environment: string;
  service: string;
}

class Logger {
  private minLevel: LogLevel;
  private service: string;

  constructor() {
    this.service = 'worldweaver-ui';
    
    // Set minimum log level based on environment
    if (isProduction()) {
      this.minLevel = LogLevel.INFO;
    } else {
      this.minLevel = LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatLogEntry(
    level: LogLevel, 
    message: string, 
    context?: LogContext, 
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      environment: process.env.NODE_ENV || 'development',
      service: this.service,
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
      };

      if (isDevelopment() || level === LogLevel.ERROR) {
        entry.error.stack = error.stack;
      }
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (isProduction()) {
      // In production, output structured JSON for log aggregation
      console.log(JSON.stringify(entry));
    } else {
      // In development, output human-readable logs
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const level = entry.level.padEnd(5);
      let output = `${timestamp} [${level}] ${entry.message}`;

      if (entry.context) {
        output += ` | Context: ${JSON.stringify(entry.context, null, 2)}`;
      }

      if (entry.error) {
        output += `\nError: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n${entry.error.stack}`;
        }
      }

      // Use appropriate console method based on level
      switch (entry.level) {
        case 'ERROR':
          console.error(output);
          break;
        case 'WARN':
          console.warn(output);
          break;
        case 'INFO':
          console.info(output);
          break;
        case 'DEBUG':
        default:
          console.log(output);
          break;
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    this.output(this.formatLogEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.output(this.formatLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    this.output(this.formatLogEntry(LogLevel.WARN, message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    this.output(this.formatLogEntry(LogLevel.ERROR, message, context, error));
  }

  // Convenience methods for common scenarios
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      method,
      url,
      ...context,
    });
  }

  apiResponse(
    method: string, 
    url: string, 
    statusCode: number, 
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `API Response: ${method} ${url} - ${statusCode} (${duration}ms)`;
    
    if (level === LogLevel.WARN) {
      this.warn(message, {
        method,
        url,
        statusCode,
        duration,
        ...context,
      });
    } else {
      this.info(message, {
        method,
        url,
        statusCode,
        duration,
        ...context,
      });
    }
  }

  authEvent(event: string, context?: LogContext): void {
    this.info(`Auth Event: ${event}`, {
      event,
      ...context,
    });
  }

  databaseQuery(query: string, duration: number, context?: LogContext): void {
    this.debug(`Database Query: ${query.substring(0, 100)}... (${duration}ms)`, {
      query: query.substring(0, 500), // Limit query length in logs
      duration,
      ...context,
    });
  }

  securityEvent(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      event,
      ...context,
    });
  }

  businessLogic(action: string, context?: LogContext): void {
    this.info(`Business Logic: ${action}`, {
      action,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience function for API route logging
export function createApiLogger(req: Request) {
  const url = new URL(req.url);
  const startTime = Date.now();

  return {
    logRequest: (context?: LogContext) => {
      logger.apiRequest(req.method, url.pathname, {
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        ...context,
      });
    },
    logResponse: (statusCode: number, context?: LogContext) => {
      const duration = Date.now() - startTime;
      logger.apiResponse(req.method, url.pathname, statusCode, duration, {
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        ...context,
      });
    },
    logError: (error: Error, context?: LogContext) => {
      logger.error(`API Error: ${req.method} ${url.pathname}`, {
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        ...context,
      }, error);
    },
  };
}

// Export function to create context from NextRequest
export function createLogContext(
  userId?: string,
  worldId?: string,
  additional?: Record<string, any>
): LogContext {
  return {
    userId,
    worldId,
    ...additional,
  };
}