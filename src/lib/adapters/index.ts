/**
 * Database-to-Domain Type Adapters
 * 
 * These functions safely convert between database schema types and domain types,
 * handling field name mismatches and ensuring type safety.
 */

import type { Database } from '../supabase/types.generated';
import type { World, Entity, Template, Folder, Profile, TemplateField } from '../types';

type DatabaseWorld = Database['public']['Tables']['worlds']['Row'];
type DatabaseEntity = Database['public']['Tables']['entities']['Row'];
type DatabaseTemplate = Database['public']['Tables']['templates']['Row'];
type DatabaseFolder = Database['public']['Tables']['folders']['Row'];
type DatabaseProfile = Database['public']['Tables']['profiles']['Row'];

/**
 * Convert database world row to domain World type
 */
export function adaptWorldFromDatabase(
  dbWorld: DatabaseWorld & { entities?: any }
): World {
  return {
    id: dbWorld.id,
    name: dbWorld.name,
    summary: dbWorld.description || undefined, // DB: description -> Domain: summary
    description: dbWorld.description || undefined,
    entityCount: Array.isArray(dbWorld.entities) ? dbWorld.entities.length : 0,
    updatedAt: dbWorld.updated_at,
    isArchived: dbWorld.is_archived ?? false,
    archivedAt: dbWorld.is_archived ? dbWorld.updated_at : undefined,
    isPublic: dbWorld.is_public ?? false,
    settings: (dbWorld.settings as Record<string, any>) ?? {},
    // Fields not in current schema but expected by domain
    imageUrl: undefined,
    coverImage: undefined,
    seatLimit: undefined,
    inviteLinkEnabled: undefined,
    inviteLinkRole: undefined,
    inviteLinkExpires: undefined,
    inviteLinkMaxUses: undefined,
  };
}

/**
 * Convert domain World type to database insert/update format
 */
export function adaptWorldToDatabase(
  domainWorld: Partial<World>
): Partial<Database['public']['Tables']['worlds']['Insert']> {
  const dbWorld: Partial<Database['public']['Tables']['worlds']['Insert']> = {};
  
  if (domainWorld.id !== undefined) dbWorld.id = domainWorld.id;
  if (domainWorld.name !== undefined) dbWorld.name = domainWorld.name;
  if (domainWorld.summary !== undefined) dbWorld.description = domainWorld.summary; // Domain: summary -> DB: description
  if (domainWorld.description !== undefined) dbWorld.description = domainWorld.description;
  if (domainWorld.isPublic !== undefined) dbWorld.is_public = domainWorld.isPublic;
  if (domainWorld.isArchived !== undefined) dbWorld.is_archived = domainWorld.isArchived;
  if (domainWorld.settings !== undefined) dbWorld.settings = domainWorld.settings as Database['public']['Tables']['worlds']['Row']['settings'];
  
  return dbWorld;
}

/**
 * Convert database entity row to domain Entity type
 */
export function adaptEntityFromDatabase(
  dbEntity: DatabaseEntity & { templates?: { name: string; category: string | null } | null }
): Entity {
  return {
    id: dbEntity.id,
    worldId: dbEntity.world_id,
    folderId: dbEntity.folder_id || undefined,
    templateId: dbEntity.template_id || undefined,
    name: dbEntity.name,
    summary: '', // Entities don't have description in current schema
    description: undefined,
    fields: (dbEntity.data as Record<string, unknown>) ?? {},
    links: [], // Will be populated by relationship service
    updatedAt: dbEntity.updated_at,
    tags: dbEntity.tags ?? [],
    templateName: dbEntity.templates?.name || undefined,
    templateCategory: dbEntity.templates?.category || undefined,
    imageUrl: undefined,
    isArchived: false, // Not in current schema
  };
}

/**
 * Convert domain Entity to database insert/update format
 */
export function adaptEntityToDatabase(
  domainEntity: Partial<Entity> & { [key: string]: any }
): Partial<Database['public']['Tables']['entities']['Insert']> {
  const { templateId, folderId, name, fields, tags, id, worldId, summary, description, links, updatedAt, templateName, templateCategory, imageUrl, isArchived, ...customFields } = domainEntity;
  
  // Merge custom fields with regular fields
  const allCustomFields = { ...(fields || {}), ...customFields };
  
  const dbEntity: Partial<Database['public']['Tables']['entities']['Insert']> = {};
  if (id !== undefined) dbEntity.id = id;
  if (templateId !== undefined) dbEntity.template_id = templateId;
  if (folderId !== undefined) dbEntity.folder_id = folderId;
  if (name !== undefined) dbEntity.name = name;
  if (Object.keys(allCustomFields).length > 0) dbEntity.data = allCustomFields as Database['public']['Tables']['entities']['Row']['data'];
  if (tags !== undefined) dbEntity.tags = tags;
  
  return dbEntity;
}

/**
 * Convert database template row to domain Template type
 */
export function adaptTemplateFromDatabase(dbTemplate: DatabaseTemplate): Template {
  return {
    id: dbTemplate.id,
    worldId: dbTemplate.world_id || '',
    folderId: undefined, // Not in current schema
    name: dbTemplate.name,
    description: dbTemplate.description || '',
    icon: dbTemplate.icon || undefined,
    category: dbTemplate.category || 'General',
    fields: (dbTemplate.fields as TemplateField[]) ?? [],
    isSystem: dbTemplate.is_system ?? false,
  };
}

/**
 * Convert domain Template to database insert/update format
 */
export function adaptTemplateToDatabase(
  domainTemplate: Partial<Template> & { [key: string]: any }
): Database['public']['Tables']['templates']['Insert'] | Database['public']['Tables']['templates']['Update'] {
  const { name, description, icon, category, fields, ...customFields } = domainTemplate;
  
  // Merge custom fields with template fields
  const allFields = Array.isArray(fields) ? [...fields, customFields] : customFields;
  
  const dbTemplate: any = {};
  if (domainTemplate.id !== undefined) dbTemplate.id = domainTemplate.id;
  if (domainTemplate.worldId !== undefined) dbTemplate.world_id = domainTemplate.worldId;
  if (name !== undefined) dbTemplate.name = name;
  if (description !== undefined) dbTemplate.description = description;
  if (icon !== undefined) dbTemplate.icon = icon;
  if (category !== undefined) dbTemplate.category = category;
  if (fields !== undefined || Object.keys(customFields).length > 0) {
    dbTemplate.fields = allFields as Database['public']['Tables']['templates']['Row']['fields'];
  }
  if (domainTemplate.isSystem !== undefined) dbTemplate.is_system = domainTemplate.isSystem;
  
  return dbTemplate;
}

/**
 * Convert database folder row to domain Folder type
 */
export function adaptFolderFromDatabase(
  dbFolder: DatabaseFolder & { entities?: any }
): Folder {
  return {
    id: dbFolder.id,
    worldId: dbFolder.world_id,
    name: dbFolder.name,
    description: dbFolder.description || '',
    color: dbFolder.color || undefined,
    kind: 'entities', // Current schema has one folders table; treat as entity folders
    count: Array.isArray(dbFolder.entities) ? dbFolder.entities.length : 0,
    data: {}, // Not in current schema but expected by domain
  };
}

/**
 * Convert domain Folder to database insert/update format
 */
export function adaptFolderToDatabase(
  domainFolder: Partial<Folder> & { [key: string]: unknown }
): Database['public']['Tables']['folders']['Insert'] | Database['public']['Tables']['folders']['Update'] {
  const { name, description, color, data, kind, count, ...customFields } = domainFolder;
  
  const dbFolder: any = {};
  if (domainFolder.id !== undefined) dbFolder.id = domainFolder.id;
  if (domainFolder.worldId !== undefined) dbFolder.world_id = domainFolder.worldId;
  if (name !== undefined) dbFolder.name = name;
  if (description !== undefined) dbFolder.description = description;
  if (color !== undefined) dbFolder.color = color;
  // Note: data field not in current schema, custom fields ignored for now
  
  return dbFolder;
}

/**
 * Convert database profile row to domain Profile type
 */
export function adaptProfileFromDatabase(dbProfile: DatabaseProfile): Profile {
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    fullName: dbProfile.full_name || undefined,
    avatarUrl: dbProfile.avatar_url || undefined,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
    data: {}, // Not in current schema but expected by domain
  };
}

/**
 * Type guard to validate if object is a valid World
 */
export function isValidWorld(obj: unknown): obj is World {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'updatedAt' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).updatedAt === 'string'
  );
}

/**
 * Type guard to validate if object is a valid Entity
 */
export function isValidEntity(obj: unknown): obj is Entity {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'worldId' in obj &&
    'name' in obj &&
    'fields' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).worldId === 'string' &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).fields === 'object'
  );
}