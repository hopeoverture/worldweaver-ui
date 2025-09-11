/**
 * Error Handling Utilities
 * Custom error classes and error handling utilities for the application
 */

import { logger } from './logger';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public context?: Record<string, any>;

  constructor(
    message: string, 
    statusCode: number = 500, 
    isOperational: boolean = true,
    code?: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, true, 'NOT_FOUND_ERROR', { resource, id });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, conflictField?: string) {
    super(message, 409, true, 'CONFLICT_ERROR', { conflictField });
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, query?: string) {
    super(`Database error: ${message}`, 500, true, 'DATABASE_ERROR', { query });
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`External service error (${service}): ${message}`, 502, true, 'EXTERNAL_SERVICE_ERROR', { service });
    this.name = 'ExternalServiceError';
  }
}

// Error response interface
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  path?: string;
}

// Error handling utilities
export class ErrorHandler {
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  static getStatusCode(error: Error): number {
    if (error instanceof AppError) {
      return error.statusCode;
    }
    
    // Handle specific Node.js/PostgreSQL errors
    if (error.name === 'ValidationError') return 400;
    if (error.name === 'CastError') return 400;
    if (error.name === 'MongoError' && (error as any).code === 11000) return 409;
    if (error.message?.includes('duplicate key')) return 409;
    if (error.message?.includes('not found')) return 404;
    
    return 500;
  }

  static getErrorCode(error: Error): string | undefined {
    if (error instanceof AppError) {
      return error.code;
    }
    return undefined;
  }

  static formatError(
    error: Error, 
    path?: string, 
    hideDetails: boolean = false
  ): ErrorResponse {
    const response: ErrorResponse = {
      error: error.message,
      code: this.getErrorCode(error),
      timestamp: new Date().toISOString(),
    };

    if (path) {
      response.path = path;
    }

    // Add details for operational errors in development
    if (!hideDetails && error instanceof AppError && error.context) {
      response.details = error.context;
    }

    return response;
  }

  static logError(error: Error, context?: Record<string, any>): void {
    const isOperational = this.isOperationalError(error);
    
    if (isOperational) {
      logger.warn('Operational error occurred', context, error);
    } else {
      logger.error('Unexpected error occurred', context, error);
    }
  }

  // Centralized error handling for API routes
  static handleApiError(
    error: Error, 
    path?: string, 
    userId?: string,
    additional?: Record<string, any>
  ): Response {
    const statusCode = this.getStatusCode(error);
    const hideDetails = process.env.NODE_ENV === 'production' && statusCode === 500;
    
    // Log the error with context
    this.logError(error, {
      path,
      userId,
      statusCode,
      ...additional,
    });

    // Format error response
    const errorResponse = this.formatError(error, path, hideDetails);
    
    // In production, don't expose internal server errors
    if (hideDetails && statusCode === 500) {
      errorResponse.error = 'Internal server error';
      errorResponse.code = 'INTERNAL_ERROR';
      delete errorResponse.details;
    }

    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Utility functions for common validations
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName, value);
  }
}

export function validateString(
  value: any, 
  fieldName: string, 
  minLength?: number, 
  maxLength?: number
): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName, value);
  }

  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters long`,
      fieldName,
      value
    );
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be no more than ${maxLength} characters long`,
      fieldName,
      value
    );
  }
}

export function validateEmail(value: string, fieldName: string = 'email'): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid email address`, fieldName, value);
  }
}

export function validateUUID(value: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`, fieldName, value);
  }
}

export function validateBoolean(value: any, fieldName: string): void {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} must be a boolean`, fieldName, value);
  }
}

export function validateNumber(
  value: any, 
  fieldName: string, 
  min?: number, 
  max?: number
): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
  }

  if (min !== undefined && value < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min}`,
      fieldName,
      value
    );
  }

  if (max !== undefined && value > max) {
    throw new ValidationError(
      `${fieldName} must be no more than ${max}`,
      fieldName,
      value
    );
  }
}

// Async error wrapper for API routes
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      const request = args.find(arg => arg && typeof arg.url === 'string');
      const path = request ? new URL(request.url).pathname : undefined;
      
      return ErrorHandler.handleApiError(
        error instanceof Error ? error : new AppError('Unknown error occurred'),
        path
      );
    }
  };
}

// Global error handlers (for unhandled errors)
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.toString?.() || String(reason),
    });
    
    // In production, gracefully shut down
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {}, error);
    
    // Always exit on uncaught exception
    process.exit(1);
  });
}