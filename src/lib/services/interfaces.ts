/**
 * Service Layer Interfaces
 * 
 * Defines the contract for all service operations.
 * This allows for different implementations (Supabase, mock, etc.)
 * and makes testing easier.
 */

import type { World, Entity, Template, Folder, RelationshipRow, Profile } from '@/lib/types';

// Base service result types
export interface ServiceResult<T> {
  data: T;
  error: null;
}

export interface ServiceError {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ServiceResponse<T> = ServiceResult<T> | ServiceError;

// Helper function to create service responses
export function createServiceResult<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

export function createServiceError(
  code: string, 
  message: string, 
  details?: unknown
): ServiceError {
  return {
    data: null,
    error: { code, message, details }
  };
}

// World service interface
export interface IWorldService {
  getUserWorlds(userId: string): Promise<World[]>;
  getWorldById(worldId: string, userId: string): Promise<World | null>;
  createWorld(worldData: Omit<World, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>, userId: string): Promise<World>;
  updateWorld(worldId: string, updates: Partial<World>, userId: string): Promise<World>;
  deleteWorld(worldId: string, userId: string): Promise<void>;
  archiveWorld(worldId: string, userId: string): Promise<World>;
}

// Entity service interface
export interface IEntityService {
  getWorldEntities(worldId: string, userId: string): Promise<Entity[]>;
  getEntityById(entityId: string, userId: string): Promise<Entity | null>;
  createEntity(entityData: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Entity>;
  updateEntity(entityId: string, updates: Partial<Entity>, userId: string): Promise<Entity>;
  deleteEntity(entityId: string, userId: string): Promise<void>;
}

// Template service interface
export interface ITemplateService {
  getWorldTemplates(worldId: string, userId: string): Promise<Template[]>;
  getTemplateById(templateId: string, userId: string): Promise<Template | null>;
  createTemplate(templateData: Partial<Template>, userId: string): Promise<Template>;
  updateTemplate(templateId: string, updates: Partial<Template>, userId: string): Promise<Template>;
  deleteTemplate(templateId: string, userId: string): Promise<void>;
}

// Folder service interface
export interface IFolderService {
  getWorldFolders(worldId: string, userId: string): Promise<Folder[]>;
  getFolderById(folderId: string, userId: string): Promise<Folder | null>;
  createFolder(folderData: Partial<Folder> & { worldId: string }, userId: string): Promise<Folder>;
  updateFolder(folderId: string, updates: Partial<Folder>, userId: string): Promise<Folder>;
  deleteFolder(folderId: string, userId: string): Promise<void>;
}

// Relationship service interface
export interface IRelationshipService {
  getWorldRelationships(worldId: string, userId: string): Promise<RelationshipRow[]>;
  getRelationshipById(relationshipId: string, userId: string): Promise<RelationshipRow | null>;
  createRelationship(relationshipData: Partial<RelationshipRow>, userId: string): Promise<RelationshipRow>;
  updateRelationship(relationshipId: string, updates: Partial<RelationshipRow>, userId: string): Promise<RelationshipRow>;
  deleteRelationship(relationshipId: string, userId: string): Promise<void>;
}

// Combined service interface for dependency injection
export interface IServiceLayer {
  worlds: IWorldService;
  entities: IEntityService;
  templates: ITemplateService;
  folders: IFolderService;
  relationships: IRelationshipService;
}

// Error codes for consistent error handling
export const ServiceErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  ACCESS_DENIED: 'ACCESS_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ServiceErrorCode = typeof ServiceErrorCodes[keyof typeof ServiceErrorCodes];