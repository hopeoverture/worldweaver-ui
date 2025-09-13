/**
 * Standardized API Response Types
 * 
 * This module defines consistent API response types across all endpoints
 * to improve type safety and error handling on the frontend.
 */

// Base API Response Structure
export type ApiResponse<T = unknown> = 
  | { success: true; data: T }
  | { success: false; error: ApiError }

// Error Response Structure
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  issues?: Array<{
    path: string[]
    message: string
  }>
}

// Error Code Constants
export const API_ERROR_CODES = {
  // Authentication & Authorization
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation Errors
  INVALID_REQUEST_BODY: 'INVALID_REQUEST_BODY',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_FORMAT: 'INVALID_FIELD_FORMAT',
  
  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Business Logic Errors
  WORLD_NOT_ACCESSIBLE: 'WORLD_NOT_ACCESSIBLE',
  ENTITY_LIMIT_EXCEEDED: 'ENTITY_LIMIT_EXCEEDED',
  INVITE_EXPIRED: 'INVITE_EXPIRED',
  INVITE_ALREADY_USED: 'INVITE_ALREADY_USED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]

// Helper function to create error responses
export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
  issues?: Array<{ path: string[]; message: string }>
): ApiError {
  return {
    code,
    message,
    ...(details && { details }),
    ...(issues && { issues })
  }
}

// Helper function to create success responses
export function createApiSuccess<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

// Helper function to create error responses
export function createApiFailure(error: ApiError): ApiResponse<never> {
  return { success: false, error }
}

// Specific Response Types for Different Resources

// World API Responses
export type WorldResponse = ApiResponse<{
  id: string
  name: string
  summary?: string
  description?: string
  entityCount: number
  updatedAt: string
  imageUrl?: string
  coverImage?: string
  isArchived?: boolean
  archivedAt?: string
  isPublic?: boolean
  settings?: Record<string, unknown>
  seatLimit?: number
  inviteLinkEnabled?: boolean
  inviteLinkRole?: string
  inviteLinkExpires?: string
  inviteLinkMaxUses?: number
}>

export type WorldsListResponse = ApiResponse<{
  worlds: Array<{
    id: string
    name: string
    summary?: string
    entityCount: number
    updatedAt: string
    imageUrl?: string
    isArchived?: boolean
  }>
}>

// Entity API Responses
export type EntityResponse = ApiResponse<{
  id: string
  worldId: string
  name: string
  summary?: string
  description?: string
  fields: Record<string, unknown>
  templateId?: string
  folderId?: string
  tags?: string[]
  links: Array<{
    id: string
    fromEntityId: string
    toEntityId: string
    relationshipType: string
  }>
  imageUrl?: string
  isArchived?: boolean
  updatedAt: string
  templateName?: string
  templateCategory?: string
}>

export type EntitiesListResponse = ApiResponse<{
  entities: Array<{
    id: string
    name: string
    summary?: string
    templateId?: string
    folderId?: string
    tags?: string[]
    updatedAt: string
  }>
}>

// Template API Responses
export type TemplateResponse = ApiResponse<{
  id: string
  name: string
  description?: string
  fields: Array<{
    name: string
    type: string
    required?: boolean
    options?: string[]
  }>
  isSystem: boolean
  worldId?: string
  createdAt: string
  updatedAt: string
}>

export type TemplatesListResponse = ApiResponse<{
  templates: Array<{
    id: string
    name: string
    description?: string
    isSystem: boolean
    worldId?: string
    updatedAt: string
  }>
}>

// Relationship API Responses
export type RelationshipResponse = ApiResponse<{
  id: string
  worldId: string
  fromEntityId: string
  toEntityId: string
  relationshipType: string
  description?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}>

export type RelationshipsListResponse = ApiResponse<{
  relationships: Array<{
    id: string
    fromEntityId: string
    toEntityId: string
    relationshipType: string
    description?: string
    metadata?: Record<string, unknown>
    updatedAt: string
  }>
}>

// Folder API Responses
export type FolderResponse = ApiResponse<{
  id: string
  worldId: string
  name: string
  description?: string
  parentId?: string
  createdAt: string
  updatedAt: string
}>

export type FoldersListResponse = ApiResponse<{
  folders: Array<{
    id: string
    name: string
    description?: string
    parentId?: string
    updatedAt: string
  }>
}>

// Invite API Responses
export type InviteResponse = ApiResponse<{
  id: string
  worldId: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expiresAt?: string
  maxUses?: number
  usedCount: number
  createdAt: string
}>

export type InvitesListResponse = ApiResponse<{
  invites: Array<{
    id: string
    email: string
    role: string
    status: 'pending' | 'accepted' | 'expired' | 'revoked'
    expiresAt?: string
    createdAt: string
  }>
}>

// Member API Responses
export type MemberResponse = ApiResponse<{
  id: string
  worldId: string
  userId: string
  email: string
  name: string
  avatar?: string
  role: string
  joinedAt: string
}>

export type MembersListResponse = ApiResponse<{
  members: Array<{
    id: string
    userId: string
    email: string
    name: string
    avatar?: string
    role: string
    joinedAt: string
  }>
}>

// File Upload Responses
export type FileUploadResponse = ApiResponse<{
  url: string
  key: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}>

// Generic Success Response
export type SuccessResponse = ApiResponse<{ success: true }>

// Pagination Support
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[]
  pagination: PaginationMeta
}>

// API Response Headers
export interface ApiResponseHeaders {
  'X-RateLimit-Remaining'?: string
  'X-RateLimit-Reset'?: string
  'X-Request-ID'?: string
}
