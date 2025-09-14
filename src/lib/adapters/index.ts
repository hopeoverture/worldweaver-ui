/**
 * Database-to-Domain Type Adapters
 * 
 * These functions safely convert between database schema types and domain types,
 * handling field name mismatches and ensuring type safety.
 */

import type { Database } from '../supabase/types.generated';
import type { World, Entity, Template, Folder, Profile, TemplateField, MemberRole } from '../types';

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
  // Extract entity count from the entities array returned by Supabase count query
  const entityCount = Array.isArray(dbWorld.entities) ? dbWorld.entities[0]?.count || 0 : 0;

  return {
    id: dbWorld.id,
    ownerId: dbWorld.owner_id,
    name: dbWorld.name,
    summary: dbWorld.description || undefined, // DB: description -> Domain: summary
    description: dbWorld.description || undefined,
    entityCount,
    updatedAt: dbWorld.updated_at,
    isArchived: dbWorld.is_archived ?? false,
    archivedAt: dbWorld.is_archived ? dbWorld.updated_at : undefined,
    isPublic: dbWorld.is_public ?? false,
    settings: (dbWorld.settings as Record<string, any>) ?? {},
    // Extended world creation fields from database
    logline: dbWorld.logline || undefined,
    genreBlend: dbWorld.genre_blend || undefined,
    overallTone: dbWorld.overall_tone || undefined,
    keyThemes: dbWorld.key_themes || undefined,
    audienceRating: dbWorld.audience_rating || undefined,
    scopeScale: dbWorld.scope_scale || undefined,
    technologyLevel: dbWorld.technology_level || undefined,
    magicLevel: dbWorld.magic_level || undefined,
    cosmologyModel: dbWorld.cosmology_model || undefined,
    climateBiomes: dbWorld.climate_biomes || undefined,
    calendarTimekeeping: dbWorld.calendar_timekeeping || undefined,
    societalOverview: dbWorld.societal_overview || undefined,
    conflictDrivers: dbWorld.conflict_drivers || undefined,
    rulesConstraints: dbWorld.rules_constraints || undefined,
    aestheticDirection: dbWorld.aesthetic_direction || undefined,
    // Fields not in current schema but expected by domain
    imageUrl: undefined,
    coverImage: undefined,
    seatLimit: undefined,
    inviteLinkEnabled: dbWorld.invite_link_enabled ?? false,
    inviteLinkRole: dbWorld.invite_link_role as MemberRole | undefined,
    inviteLinkExpires: dbWorld.invite_link_expires || undefined,
    inviteLinkMaxUses: dbWorld.invite_link_max_uses || undefined,
  };
}

/**
 * Convert domain World type to database insert/update format
 */
export function adaptWorldToDatabase(
  domainWorld: Partial<World>
): Partial<Database['public']['Tables']['worlds']['Insert']> {
  const dbWorld: Partial<Database['public']['Tables']['worlds']['Insert']> = {};
  
  // Basic fields
  if (domainWorld.id !== undefined) dbWorld.id = domainWorld.id;
  if (domainWorld.name !== undefined) dbWorld.name = domainWorld.name;
  if (domainWorld.summary !== undefined) dbWorld.description = domainWorld.summary; // Domain: summary -> DB: description
  if (domainWorld.description !== undefined) dbWorld.description = domainWorld.description;
  if (domainWorld.isPublic !== undefined) dbWorld.is_public = domainWorld.isPublic;
  if (domainWorld.isArchived !== undefined) dbWorld.is_archived = domainWorld.isArchived;
  if (domainWorld.settings !== undefined) dbWorld.settings = domainWorld.settings as Database['public']['Tables']['worlds']['Row']['settings'];
  
  // Extended world creation fields (Domain camelCase -> DB snake_case)
  if (domainWorld.logline !== undefined) dbWorld.logline = domainWorld.logline;
  if (domainWorld.genreBlend !== undefined) dbWorld.genre_blend = domainWorld.genreBlend;
  if (domainWorld.overallTone !== undefined) dbWorld.overall_tone = domainWorld.overallTone;
  if (domainWorld.keyThemes !== undefined) dbWorld.key_themes = domainWorld.keyThemes;
  if (domainWorld.audienceRating !== undefined) dbWorld.audience_rating = domainWorld.audienceRating;
  if (domainWorld.scopeScale !== undefined) dbWorld.scope_scale = domainWorld.scopeScale;
  if (domainWorld.technologyLevel !== undefined) dbWorld.technology_level = domainWorld.technologyLevel;
  if (domainWorld.magicLevel !== undefined) dbWorld.magic_level = domainWorld.magicLevel;
  if (domainWorld.cosmologyModel !== undefined) dbWorld.cosmology_model = domainWorld.cosmologyModel;
  if (domainWorld.climateBiomes !== undefined) dbWorld.climate_biomes = domainWorld.climateBiomes;
  if (domainWorld.calendarTimekeeping !== undefined) dbWorld.calendar_timekeeping = domainWorld.calendarTimekeeping;
  if (domainWorld.societalOverview !== undefined) dbWorld.societal_overview = domainWorld.societalOverview;
  if (domainWorld.conflictDrivers !== undefined) dbWorld.conflict_drivers = domainWorld.conflictDrivers;
  if (domainWorld.rulesConstraints !== undefined) dbWorld.rules_constraints = domainWorld.rulesConstraints;
  if (domainWorld.aestheticDirection !== undefined) dbWorld.aesthetic_direction = domainWorld.aestheticDirection;
  
  // Invite link settings
  if (domainWorld.inviteLinkEnabled !== undefined) dbWorld.invite_link_enabled = domainWorld.inviteLinkEnabled;
  if (domainWorld.inviteLinkRole !== undefined) dbWorld.invite_link_role = domainWorld.inviteLinkRole;
  if (domainWorld.inviteLinkExpires !== undefined) dbWorld.invite_link_expires = domainWorld.inviteLinkExpires;
  if (domainWorld.inviteLinkMaxUses !== undefined) dbWorld.invite_link_max_uses = domainWorld.inviteLinkMaxUses;
  
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
    imageUrl: dbEntity.image_url || undefined,
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
  if (imageUrl !== undefined) dbEntity.image_url = imageUrl;

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
    description: dbFolder.description || undefined,
    color: dbFolder.color || undefined,
    kind: (dbFolder as any).kind as 'entities' | 'templates' || 'entities', // Should be set by database, default to entities as fallback
    count: 0, // Entity count will be fetched separately if needed
    parentFolderId: dbFolder.parent_folder_id || undefined,
    createdAt: dbFolder.created_at,
    updatedAt: dbFolder.updated_at,
    data: {}, // Folders don't have custom data fields in current schema
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
    data: {}, // Profiles don't have custom data fields in current schema
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