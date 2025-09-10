// Re-export generated database types
export * from './generated-types';
export type { DatabaseTable, DatabaseFunction } from './generated-types';
export { DATABASE_TABLES, DATABASE_FUNCTIONS } from './generated-types';

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
  | { [key: string]: Json }
  | Json[]

export type World = {
  id: ID;
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
}

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

// Folder type with custom fields
export type Folder = {
  id: ID;
  worldId: ID;
  name: string;
  description?: string;
  kind: FolderKind;
  color?: string;
  count: number;
  data?: Record<string, unknown>; // Custom fields
};

// Profile type with custom fields
export type Profile = {
  id: ID;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  data?: Record<string, unknown>; // Custom fields
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
  label: string;
};

export type Entity = {
  id: ID;
  worldId: ID;
  folderId?: ID;
  templateId?: ID;
  name: string;
  summary?: string;
  description?: string;
  fields: Record<string, unknown>; // key by TemplateField.id
  links: Link[];
  tags?: string[];
  imageUrl?: string;
  isArchived?: boolean;
  updatedAt: string; // ISO
  templateName?: string;
  templateCategory?: string;
};

export type RelationshipRow = {
  id: ID;
  worldId: ID;
  from: ID; // entity id
  to: ID;   // entity id
  label: string;
};
