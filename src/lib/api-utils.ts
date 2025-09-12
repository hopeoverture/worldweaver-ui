/**
 * API Response Utilities
 * 
 * Helper functions for creating consistent API responses
 * across all Next.js API routes.
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logError } from './logging'
import { 
  ApiResponse, 
  ApiError, 
  ApiErrorCode, 
  API_ERROR_CODES,
  createApiError,
  createApiSuccess,
  createApiFailure,
  ApiResponseHeaders
} from './api-types'

// HTTP Status Code Mapping
const ERROR_STATUS_MAP: Record<ApiErrorCode, number> = {
  [API_ERROR_CODES.AUTHENTICATION_REQUIRED]: 401,
  [API_ERROR_CODES.INVALID_TOKEN]: 401,
  [API_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 403,
  [API_ERROR_CODES.INVALID_REQUEST_BODY]: 400,
  [API_ERROR_CODES.MISSING_REQUIRED_FIELD]: 400,
  [API_ERROR_CODES.INVALID_FIELD_FORMAT]: 400,
  [API_ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [API_ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 409,
  [API_ERROR_CODES.RESOURCE_CONFLICT]: 409,
  [API_ERROR_CODES.WORLD_NOT_ACCESSIBLE]: 403,
  [API_ERROR_CODES.ENTITY_LIMIT_EXCEEDED]: 400,
  [API_ERROR_CODES.INVITE_EXPIRED]: 400,
  [API_ERROR_CODES.INVITE_ALREADY_USED]: 400,
  [API_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [API_ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
  [API_ERROR_CODES.DATABASE_ERROR]: 500,
  [API_ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 502,
}

/**
 * Create a successful API response
 */
export function apiSuccess<T>(
  data: T, 
  headers?: ApiResponseHeaders
): NextResponse<ApiResponse<T>> {
  const response = createApiSuccess(data)
  
  const responseHeaders: Record<string, string> = {}
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      if (value) responseHeaders[key] = value
    })
  }
  
  return NextResponse.json(response, { 
    status: 200,
    headers: responseHeaders
  })
}

/**
 * Create an error API response
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
  issues?: Array<{ path: string[]; message: string }>,
  headers?: ApiResponseHeaders
): NextResponse<ApiResponse<never>> {
  const error = createApiError(code, message, details, issues)
  const response = createApiFailure(error)
  const status = ERROR_STATUS_MAP[code] || 500
  
  const responseHeaders: Record<string, string> = {}
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      if (value) responseHeaders[key] = value
    })
  }
  
  return NextResponse.json(response, { 
    status,
    headers: responseHeaders
  })
}

/**
 * Handle authentication errors
 */
export function apiAuthRequired(
  message: string = 'Authentication required'
): NextResponse<ApiResponse<never>> {
  return apiError(API_ERROR_CODES.AUTHENTICATION_REQUIRED, message)
}

/**
 * Handle validation errors from Zod
 */
export function apiValidationError(
  zodError: ZodError,
  message: string = 'Invalid request body'
): NextResponse<ApiResponse<never>> {
  const issues = zodError.issues.map(issue => ({
    path: issue.path.map(String),
    message: issue.message
  }))
  
  return apiError(
    API_ERROR_CODES.INVALID_REQUEST_BODY,
    message,
    { zodError: zodError.format() },
    issues
  )
}

/**
 * Handle not found errors
 */
export function apiNotFound(
  resource: string = 'Resource'
): NextResponse<ApiResponse<never>> {
  return apiError(
    API_ERROR_CODES.RESOURCE_NOT_FOUND,
    `${resource} not found`
  )
}

/**
 * Handle permission errors
 */
export function apiPermissionDenied(
  message: string = 'Insufficient permissions'
): NextResponse<ApiResponse<never>> {
  return apiError(API_ERROR_CODES.INSUFFICIENT_PERMISSIONS, message)
}

/**
 * Handle rate limiting errors
 */
export function apiRateLimited(
  resetTime?: number,
  remaining?: number
): NextResponse<ApiResponse<never>> {
  const headers: ApiResponseHeaders = {}
  if (resetTime) headers['X-RateLimit-Reset'] = resetTime.toString()
  if (remaining !== undefined) headers['X-RateLimit-Remaining'] = remaining.toString()
  
  return apiError(
    API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded. Please try again later.',
    { resetTime, remaining },
    undefined,
    headers
  )
}

/**
 * Handle internal server errors
 */
export function apiInternalError(
  message: string = 'Internal server error',
  details?: Record<string, unknown>
): NextResponse<ApiResponse<never>> {
  // Log the error for debugging (don't expose internal details to client)
  try {
    logError('API Internal Error', new Error(message), { action: 'api_internal_error', metadata: details })
  } catch {}
  
  return apiError(
    API_ERROR_CODES.INTERNAL_SERVER_ERROR,
    'Something went wrong. Please try again later.'
  )
}

/**
 * Handle database errors
 */
export function apiDatabaseError(
  operation: string = 'database operation'
): NextResponse<ApiResponse<never>> {
  try {
    logError('Database error', new Error(`Database error during ${operation}`), { action: 'api_database_error', metadata: { operation } })
  } catch {}
  
  return apiError(
    API_ERROR_CODES.DATABASE_ERROR,
    'Database operation failed. Please try again later.'
  )
}

/**
 * Wrap API route handlers with error handling
 */
export function withApiErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiResponse<never>>> => {
    try {
      return await handler(...args)
    } catch (error) {
      try {
        logError('Unhandled API error', error as Error, { action: 'api_unhandled' })
      } catch {}
      
      if (error instanceof ZodError) {
        return apiValidationError(error)
      }
      
      if (error instanceof Error) {
        // Check if it's a specific error type we can handle
        if (error.message.includes('not found')) {
          return apiNotFound()
        }
        
        if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          return apiPermissionDenied()
        }
        
        if (error.message.includes('rate limit')) {
          return apiRateLimited()
        }
      }
      
      return apiInternalError()
    }
  }
}

/**
 * Parse request body with error handling
 */
export async function parseRequestBody<T>(
  request: Request,
  schema?: { parse: (data: unknown) => T }
): Promise<T | { error: NextResponse<ApiResponse<never>> }> {
  try {
    const body = await request.json()
    
    if (schema) {
      try {
        return schema.parse(body)
      } catch (error) {
        if (error instanceof ZodError) {
          return { error: apiValidationError(error) }
        }
        throw error
      }
    }
    
    return body as T
  } catch (error) {
    return { 
      error: apiError(
        API_ERROR_CODES.INVALID_REQUEST_BODY,
        'Invalid JSON in request body'
      )
    }
  }
}

/**
 * Generate request ID for tracing
 */
export function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Add standard headers to API responses
 */
export function addStandardHeaders(
  response: NextResponse,
  requestId?: string
): NextResponse {
  if (requestId) {
    response.headers.set('X-Request-ID', requestId)
  }
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}
