export type ID = string;

export type World = {
  id: ID;
  name: string;
  summary?: string;
  entityCount: number;
  updatedAt: string; // ISO
  imageUrl?: string;
  isArchived?: boolean;
  archivedAt?: string; // ISO
  seatLimit?: number;
  inviteLinkEnabled?: boolean;
  inviteLinkRole?: MemberRole;
  inviteLinkExpires?: string; // ISO
  inviteLinkMaxUses?: number;
};

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
  invitedBy?: ID; // user ID
};

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
};

export type WorldBan = {
  id: ID;
  worldId: ID;
  userId?: ID;
  email: string;
  reason: string;
  bannedBy: ID; // user ID
  bannedAt: string; // ISO
  unbannedAt?: string; // ISO
};

export type FolderKind = 'entities' | 'templates';

export type Folder = {
  id: ID;
  worldId: ID;
  name: string;
  description?: string;
  kind: FolderKind;
  color?: string;
  count: number;
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
  folderId?: ID;
  fields: TemplateField[];
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
  templateId: ID;
  name: string;
  summary?: string;
  fields: Record<string, unknown>; // key by TemplateField.id
  links: Link[];
  updatedAt: string; // ISO
};

export type RelationshipRow = {
  id: ID;
  worldId: ID;
  from: ID; // entity id
  to: ID;   // entity id
  label: string;
};
