// Import and re-export database types for easier imports (canonical source)
import type { Database, Json } from './types.generated'
export type { Database, Json } from './types.generated'

// Convenience type exports for common table types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for common usage
export type Profile = Tables<'profiles'>
export type World = Tables<'worlds'>
export type WorldMember = Tables<'world_members'>
export type Folder = Tables<'folders'>
export type Template = Tables<'templates'>
export type Entity = Tables<'entities'>
export type Relationship = Tables<'relationships'>
export type WorldBan = Tables<'world_bans'>

// Insert types
export type ProfileInsert = TablesInsert<'profiles'>
export type WorldInsert = TablesInsert<'worlds'>
export type EntityInsert = TablesInsert<'entities'>
export type FolderInsert = TablesInsert<'folders'>
export type TemplateInsert = TablesInsert<'templates'>
export type RelationshipInsert = TablesInsert<'relationships'>

// Update types
export type WorldUpdate = TablesUpdate<'worlds'>
export type EntityUpdate = TablesUpdate<'entities'>
export type FolderUpdate = TablesUpdate<'folders'>
export type TemplateUpdate = TablesUpdate<'templates'>

// Enum types
export type WorldMemberRole = Database['public']['Enums']['world_member_role']

// Utility types for common queries
export type WorldWithMembers = World & {
  world_members: WorldMember[]
}

export type EntityWithTemplate = Entity & {
  templates: Template | null
}

export type FolderWithEntities = Folder & {
  entities: Entity[]
}
