// Re-export actual Supabase generated database types
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './supabase/types.generated';

export type WorldInvite = {
  id: ID;
  worldId: ID;
  email: string;
  role: MemberRole;
  invitedBy: ID; // user ID
  invitedAt: string; // ISO
  expiresAt: string; // ISO
  acceptedAt?: string; // ISO
  revokedAt?: string; // ISO
};
export type ID = string;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ==============================================
// JSONB Field Structure Interfaces
// ==============================================

// Template Field Structure - stored in templates.fields JSONB column
export interface TemplateFieldData {
  id: string;
  name: string;
  type: FieldType;
  prompt?: string;
  required?: boolean;
  options?: string[];
  referenceType?: string;
}

// Entity Data Structure - stored in entities.data JSONB column
export interface EntityData {
  [fieldName: string]: EntityFieldValue;
}

export type EntityFieldValue = 
  | string 
  | number 
  | boolean 
  | string[] 
  | EntityReference[]
  | null;

export interface EntityReference {
  id: string;
  name: string;
  type?: string;
}

// World Settings Structure - stored in worlds.settings JSONB column
// Note: For type safety, cast values appropriately when reading from database
export type WorldSettings = Record<string, Json>

// Relationship Metadata Structure - stored in relationships.metadata JSONB column
// Note: For type safety, cast values appropriately when reading from database
export type RelationshipMetadata = Record<string, Json>

// Folder Data Structure - stored in folders.data JSONB column
// Note: For type safety, cast values appropriately when reading from database
export type FolderData = Record<string, Json>

// Profile Data Structure - stored in profiles.data JSONB column
// Note: For type safety, cast values appropriately when reading from database
export type ProfileData = Record<string, Json>

export type World = {
  id: ID;
  ownerId: ID;
  name: string;
  summary?: string;
  description?: string;
  entityCount: number;
  updatedAt: string; // ISO
  imageUrl?: string;
  coverImage?: string;
  isArchived?: boolean;
  archivedAt?: string; // ISO
  isPublic?: boolean;
  settings?: Record<string, Json>;
  seatLimit?: number;
  inviteLinkEnabled?: boolean;
  inviteLinkRole?: MemberRole;
  inviteLinkExpires?: string; // ISO
  inviteLinkMaxUses?: number;
  // Extended world creation fields
  logline?: string;
  genreBlend?: string[];
  overallTone?: string;
  keyThemes?: string[];
  audienceRating?: string;
  scopeScale?: string;
  technologyLevel?: string[];
  magicLevel?: string[];
  cosmologyModel?: string;
  climateBiomes?: string[];
  calendarTimekeeping?: string;
  societalOverview?: string;
  conflictDrivers?: string[];
  rulesConstraints?: string;
  aestheticDirection?: string;
}

// Note: 'owner' is a virtual role for UI purposes only
// In the database, owners are stored in worlds.owner_id, not world_members table  
// The database enum world_member_role only supports: 'admin' | 'editor' | 'viewer'
export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

export type Permission = 
  | 'read_world'
  | 'create_cards'
  | 'edit_any_card'
  | 'delete_any_card'
  | 'manage_members'
  | 'change_world_settings'
  | 'run_ai_generations'
  | 'export_import';

export type RolePermissions = Record<MemberRole, Permission[]>;

export type WorldMember = {
  id: ID;
  worldId: ID;
  userId: ID;
  email: string;
  name: string;
  avatar?: string;
  role: MemberRole;
  joinedAt: string; // ISO
  lastActiveAt: string; // ISO
  invitedAt: string; // ISO
  expiresAt: string; // ISO
  acceptedAt?: string; // ISO
  revokedAt?: string; // ISO
  };
// Removed stray closing brace

export type JoinRequest = {
  id: ID;
  worldId: ID;
  userId: ID;
  email: string;
  name: string;
  note?: string;
  requestedAt: string; // ISO
  approvedAt?: string; // ISO
  declinedAt?: string; // ISO
  approvedBy?: ID; // user ID
}

export type WorldBan = {
  id: ID;
  worldId: ID;
  userId?: ID;
  email: string;
  reason: string;
  bannedBy: ID; // user ID
  bannedAt: string; // ISO
  unbannedAt?: string; // ISO
}

export type FolderKind = 'entities' | 'templates';

// Folder type aligned with database schema
export type Folder = {
  id: ID;
  worldId: ID;
  name: string;
  description?: string;
  kind?: FolderKind; // Optional since not in database schema yet
  color?: string;
  count: number;
  parentFolderId?: string; // From database schema
  createdAt?: string; // From database schema
  updatedAt?: string; // From database schema
  data?: Record<string, unknown>; // Custom fields
};

// Profile type aligned with database schema
export type Profile = {
  id: ID;
  email: string;
  fullName?: string; // Maps to full_name in database
  avatarUrl?: string; // Maps to avatar_url in database
  createdAt?: string; // Maps to created_at in database
  updatedAt?: string; // Maps to updated_at in database
  data?: ProfileData; // Typed JSONB field
};

export type FieldType =
  | 'shortText'
  | 'longText'
  | 'richText'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'image'
  | 'reference';

export type TemplateField = {
  id: ID;
  name: string;
  prompt?: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  referenceType?: string;
};

export type Template = {
  id: ID;
  worldId: ID;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  folderId?: ID;
  fields: TemplateField[];
  isSystem?: boolean;
};

export type Link = {
  id: ID;
  fromEntityId: ID;
  toEntityId: ID;
  relationshipType: string; // Changed from label for consistency
};

export type Entity = {
  id: ID;
  worldId: ID;
  folderId?: ID;
  templateId?: ID;
  name: string;
  summary?: string; // Not in database schema
  description?: string; // Not in database schema
  fields: Record<string, unknown>; // Maps to data JSONB field in database
  links: Link[]; // Computed from relationships
  tags?: string[]; // From database schema
  imageUrl?: string; // Not in database schema
  isArchived?: boolean; // Not in database schema
  createdAt?: string; // From database schema
  updatedAt: string; // Maps to updated_at in database
  templateName?: string; // Computed from template join
  templateCategory?: string; // Computed from template join
};

export type RelationshipRow = {
  id: ID;
  worldId: ID;
  from: ID; // entity id (maps to from_entity_id in database)
  to: ID;   // entity id (maps to to_entity_id in database)
  relationshipType: string; // Maps to relationship_type in database
  description?: string; // From database schema
  metadata?: RelationshipMetadata; // Typed JSONB field
  createdAt?: string; // From database schema
  updatedAt?: string; // From database schema
};
