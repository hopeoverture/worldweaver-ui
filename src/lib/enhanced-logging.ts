/**
 * Enhanced Logging System
 * 
 * Provides structured logging with different levels, redaction of sensitive data,
 * and proper handling for development vs production environments.
 */

import { getEnv } from './env-validation';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  requestId?: string;
  userId?: string;
  action?: string;
}

// Sensitive fields that should be redacted in logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'key',
  'secret',
  'api_key',
  'apiKey',
  'authorization',
  'cookie',
  'session',
  'supabase',
  'auth',
  'credential',
  'private',
];

/**
 * Enhanced Logger Class
 */
export class EnhancedLogger {
  private currentLevel: LogLevel;
  private redactionEnabled: boolean;

  constructor() {
    const env = getEnv();
    
    // Set log level based on environment
    this.currentLevel = env.NODE_ENV === 'production' 
      ? LogLevel.WARN 
      : LogLevel.DEBUG;
    
    this.redactionEnabled = env.NODE_ENV === 'production';
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Redact sensitive information from log data
   */
  private redactSensitiveData(data: unknown): unknown {
    if (!this.redactionEnabled) {
      return data;
    }

    if (typeof data === 'string') {
      // Redact JWT tokens and similar patterns
      return data.replace(
        /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
        '[REDACTED_TOKEN]'
      );
    }

    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    if (data && typeof data === 'object') {
      const redacted: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(data)) {
        const keyLower = key.toLowerCase();
        const isSensitive = SENSITIVE_FIELDS.some(field => 
          keyLower.includes(field)
        );
        
        if (isSensitive) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this.redactSensitiveData(value);
        }
      }
      
      return redacted;
    }

    return data;
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.redactSensitiveData(context) as Record<string, unknown> : undefined,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.redactionEnabled ? undefined : error.stack,
      } as Error : undefined,
    };
  }

  /**
   * Output log entry to appropriate destination
   */
  private output(entry: LogEntry): void {
    if (entry.level < this.currentLevel) {
      return; // Skip logs below current level
    }

    const env = getEnv();
    
    // In production, we might want to send to external logging service
    if (env.NODE_ENV === 'production') {
      // TODO: Send to logging service (e.g., DataDog, LogRocket, etc.)
      
      // For now, use console for critical errors only
      if (entry.level >= LogLevel.ERROR) {
        console.error(JSON.stringify(entry));
      }
    } else {
      // Development: use console with better formatting
      const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
      const levelName = levelNames[entry.level];
      
      const prefix = `[${entry.timestamp}] ${levelName}:`;
      const args = [prefix, entry.message];
      
      if (entry.context) {
        args.push('\nContext:', JSON.stringify(entry.context, null, 2));
      }
      
      if (entry.error) {
        args.push('\nError:', entry.error.message || entry.error.toString());
      }

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(...args);
          break;
        case LogLevel.INFO:
          console.info(...args);
          break;
        case LogLevel.WARN:
          console.warn(...args);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(...args);
          break;
      }
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.output(entry);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.output(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.output(entry);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.output(entry);
  }

  /**
   * Log critical error message
   */
  critical(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, error);
    this.output(entry);
  }

  /**
   * Log performance timing
   */
  performance(operation: string, duration: number, context?: Record<string, unknown>): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...context,
    });
  }

  /**
   * Log security event
   */
  security(event: string, context?: Record<string, unknown>): void {
    this.warn(`Security Event: ${event}`, {
      event,
      ...context,
    });
  }
}

// Export singleton instance
let logger: EnhancedLogger | null = null;

export function getLogger(): EnhancedLogger {
  if (!logger) {
    logger = new EnhancedLogger();
  }
  return logger;
}

// Convenience functions for backwards compatibility
export function logError(
  message: string, 
  error: Error, 
  context?: Record<string, unknown>
): void {
  getLogger().error(message, error, context);
}

export function logInfo(
  message: string, 
  context?: Record<string, unknown>
): void {
  getLogger().info(message, context);
}

export function logWarning(
  message: string, 
  context?: Record<string, unknown>
): void {
  getLogger().warn(message, context);
}

export function logDebug(
  message: string, 
  context?: Record<string, unknown>
): void {
  getLogger().debug(message, context);
}

export function logPerformance(
  operation: string, 
  duration: number, 
  context?: Record<string, unknown>
): void {
  getLogger().performance(operation, duration, context);
}

export function logSecurity(
  event: string, 
  context?: Record<string, unknown>
): void {
  getLogger().security(event, context);
}

// Performance timing helper
export function createPerformanceTimer(operation: string) {
  const start = performance.now();
  
  return {
    end: (context?: Record<string, unknown>) => {
      const duration = performance.now() - start;
      logPerformance(operation, duration, context);
      return duration;
    }
  };
}