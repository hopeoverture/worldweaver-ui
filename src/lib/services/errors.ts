/**
 * Service Layer Error Handling
 * 
 * Provides standardized error classes and error handling utilities
 * for the service layer.
 */

import { logError } from '@/lib/logging';
import { ServiceErrorCode, ServiceErrorCodes } from './interfaces';

/**
 * Base service error class
 */
export class ServiceError extends Error {
  constructor(
    public code: ServiceErrorCode,
    message: string,
    public details?: unknown,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  /**
   * Create a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case ServiceErrorCodes.NOT_FOUND:
        return 'The requested item was not found.';
      case ServiceErrorCodes.ACCESS_DENIED:
        return 'You do not have permission to perform this action.';
      case ServiceErrorCodes.VALIDATION_ERROR:
        return 'The provided data is invalid.';
      case ServiceErrorCodes.RATE_LIMITED:
        return 'Too many requests. Please try again later.';
      case ServiceErrorCodes.DATABASE_ERROR:
        return 'A database error occurred. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Convert to API response format
   */
  toApiResponse() {
    return {
      error: {
        code: this.code,
        message: this.getUserMessage(),
        details: process.env.NODE_ENV === 'development' ? this.details : undefined
      }
    };
  }
}

/**
 * Specific error classes for different scenarios
 */
export class NotFoundError extends ServiceError {
  constructor(resource: string, id?: string, cause?: Error) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(ServiceErrorCodes.NOT_FOUND, message, { resource, id }, cause);
  }
}

export class AccessDeniedError extends ServiceError {
  constructor(resource: string, action: string, userId?: string, cause?: Error) {
    const message = `Access denied to ${action} ${resource}`;
    super(ServiceErrorCodes.ACCESS_DENIED, message, { resource, action, userId }, cause);
  }
}

export class ValidationError extends ServiceError {
  constructor(field: string, reason: string, value?: unknown, cause?: Error) {
    const message = `Validation failed for ${field}: ${reason}`;
    super(ServiceErrorCodes.VALIDATION_ERROR, message, { field, reason, value }, cause);
  }
}

export class DatabaseError extends ServiceError {
  constructor(operation: string, cause: Error) {
    const message = `Database error during ${operation}`;
    super(ServiceErrorCodes.DATABASE_ERROR, message, { operation }, cause);
  }
}

/**
 * Error handling decorator for service methods (simplified)
 */
export function handleServiceErrors(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  // Simple pass-through for now - decorator pattern proved too complex
  return descriptor;
}

/**
 * Utility function to handle errors in service methods
 */
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }

    // Log unexpected errors
    logError(`Service error in ${operation}`, error as Error, { action: operation });

    // Convert to service error
    throw new ServiceError(
      ServiceErrorCodes.INTERNAL_ERROR,
      `Error in ${operation}`,
      undefined,
      error as Error
    );
  }
}