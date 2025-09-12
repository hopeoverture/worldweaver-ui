/**
 * Structured logging utility for production environments
 * Replaces console.error with proper logging that doesn't expose sensitive data
 */

export interface LogContext {
  userId?: string;
  worldId?: string;
  entityId?: string;
  entityIds?: string[]; // For bulk operations
  folderId?: string;
  worldIds?: string[]; // For bulk world access checks
  templateId?: string;
  templateName?: string;
  action?: string;
  component?: string;
  endpoint?: string;
  userAgent?: string;
  timestamp?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  key?: string; // For rate limiting
  fromEntityId?: string; // For relationships
  toEntityId?: string; // For relationships
  relationshipId?: string; // For relationship operations
  folderName?: string; // For folder operations
  role?: string; // For member role operations
}

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Sanitize error to remove sensitive information
 */
function sanitizeError(error: Error): { name: string; message: string; stack?: string; code?: string } {
  // Handle cases where error might be null, undefined, or not a proper Error object
  if (!error || typeof error !== 'object') {
    return {
      name: 'Error',
      message: 'Unknown error (invalid error object)',
      code: undefined
    };
  }

  const sanitized: { name: string; message: string; stack?: string; code?: string } = {
    name: error.name || 'Error',
    message: error.message || 'Unknown error',
    code: (error as any).code || undefined
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    sanitized.stack = error.stack;
  }

  // Sanitize sensitive information from error messages
  const sensitivePatterns = [
    /password[=:]\s*\S+/gi,
    /token[=:]\s*\S+/gi,
    /key[=:]\s*\S+/gi,
    /secret[=:]\s*\S+/gi,
    /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, // JWT tokens
  ];

  sensitivePatterns.forEach(pattern => {
    sanitized.message = sanitized.message.replace(pattern, '[REDACTED]');
  });

  return sanitized;
}

/**
 * Sanitize context to remove PII and sensitive data
 */
function sanitizeContext(context: LogContext): LogContext {
  const sanitized = { ...context };

  // Remove or hash sensitive identifiers in production
  if (process.env.NODE_ENV === 'production') {
    if (sanitized.userId) {
      sanitized.userId = `user_${sanitized.userId.substring(0, 8)}...`;
    }
  }

  return sanitized;
}

/**
 * Core logging function
 */
function log(entry: LogEntry): void {
  const timestamp = new Date().toISOString();
  const sanitizedEntry = {
    ...entry,
    timestamp,
    context: entry.context ? sanitizeContext(entry.context) : undefined,
    error: entry.error ? sanitizeError(entry.error as Error) : undefined
  };

  // In production, you would send this to your logging service
  // For now, we use console but with structured format
  if (process.env.NODE_ENV === 'development') {
    switch (entry.level) {
      case 'error':
        console.error('[ERROR]', sanitizedEntry);
        break;
      case 'warn':
        console.warn('[WARN]', sanitizedEntry);
        break;
      case 'info':
        console.info('[INFO]', sanitizedEntry);
        break;
      case 'debug':
        console.debug('[DEBUG]', sanitizedEntry);
        break;
    }
  } else {
    // In production, send to external logging service
    // e.g., fetch('/api/logs', { method: 'POST', body: JSON.stringify(sanitizedEntry) })
    console.log(JSON.stringify(sanitizedEntry));
  }
}

/**
 * Log error with context
 */
export function logError(message: string, error?: Error, context?: LogContext): void {
  log({
    level: 'error',
    message,
    error: error ? sanitizeError(error) : undefined,
    context
  });
}

/**
 * Log warning with context
 */
export function logWarning(message: string, context?: LogContext): void {
  log({
    level: 'warn',
    message,
    context
  });
}

/**
 * Log info with context
 */
export function logInfo(message: string, context?: LogContext): void {
  log({
    level: 'info',
    message,
    context
  });
}

/**
 * Log debug information (only in development)
 */
export function logDebug(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    log({
      level: 'debug',
      message,
      context
    });
  }
}

/**
 * Replace console.error usage - safe error logging for production
 */
export function safeConsoleError(message: string, error?: Error, context?: LogContext): void {
  logError(message, error, context);
}

/**
 * Create error boundary error handler
 */
export function createErrorBoundaryLogger(componentName: string) {
  return (error: Error, errorInfo: { componentStack?: string | null }) => {
    logError(`Error boundary caught error in ${componentName}`, error, {
      component: componentName,
      action: 'error_boundary_catch',
      metadata: {
        componentStack: errorInfo.componentStack || 'unknown'
      }
    });
  };
}

/**
 * Create API error logger
 */
export function logApiError(endpoint: string, error: Error, context?: Partial<LogContext>): void {
  logError(`API error on ${endpoint}`, error, {
    ...context,
    endpoint,
    action: 'api_request'
  });
}

/**
 * Create auth error logger
 */
export function logAuthError(action: string, error: Error, context?: Partial<LogContext>): void {
  logError(`Authentication error during ${action}`, error, {
    ...context,
    action: `auth_${action}`,
    component: 'auth'
  });
}

/**
 * Create database error logger
 */
export function logDatabaseError(operation: string, error: Error, context?: Partial<LogContext>): void {
  logError(`Database error during ${operation}`, error, {
    ...context,
    action: `db_${operation}`,
    component: 'database'
  });
}

/**
 * Network error handler with retry logic awareness
 */
export function logNetworkError(url: string, error: Error, retryAttempt?: number): void {
  logError('Network request failed', error, {
    endpoint: url,
    action: 'network_request',
    metadata: {
      retryAttempt: retryAttempt || 0,
      isRetryable: error.name === 'TypeError' || error.message.includes('fetch')
    }
  });
}

/**
 * User action logger (for debugging user flows)
 */
export function logUserAction(action: string, context?: LogContext): void {
  logInfo(`User action: ${action}`, {
    ...context,
    action: `user_${action}`
  });
}

/**
 * Audit logger for sensitive operations
 * These logs should be treated as security events and monitored closely
 */
export function logAuditEvent(action: string, context?: LogContext & {
  targetUserId?: string;
  targetEmail?: string;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): void {
  logInfo(`AUDIT: ${action}`, {
    ...context,
    action: `audit_${action}`,
    // Mark as audit event for filtering/monitoring
    metadata: {
      ...context?.metadata,
      isAuditEvent: true,
      timestamp: new Date().toISOString(),
      severity: 'high'
    }
  });
}

/**
 * Performance logger
 */
export function logPerformance(operation: string, duration: number, context?: LogContext): void {
  const level = duration > 1000 ? 'warn' : 'info';
  
  log({
    level,
    message: `Performance: ${operation} took ${duration}ms`,
    context: {
      ...context,
      action: `perf_${operation}`,
      metadata: {
        duration,
        slow: duration > 1000
      }
    }
  });
}
