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
  requireForAIContext?: boolean;
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

// ==============================================
// AI Usage Tracking Types
// ==============================================

// AI Usage Record - maps to ai_usage table
export interface AIUsageRecord {
  id: number;
  userId: string;
  operation: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number | null;
  costUsd: number;
  currency: string;
  model: string | null;
  provider: string | null;
  requestId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  success: boolean | null;
  errorCode: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// AI Quota Record - maps to ai_quotas table
export interface AIQuotaRecord {
  id: number;
  userId: string;
  periodStart: string;
  periodEnd: string;
  tokenLimit: number | null;
  usdLimit: number | null;
  usedTokens: number;
  usedUsd: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ==============================================
// AI Generation Types
// ==============================================

export interface AIGenerationStatus {
  isGenerating: boolean;
  progress?: number;
  stage?: string;
  error?: string;
}

export interface AITemplateGenerationRequest {
  prompt?: string;
  templateName?: string;
  worldId: string;
}

export interface AITemplateGenerationResponse {
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: FieldType;
    prompt?: string;
    required?: boolean;
    options?: string[];
  }>;
}

export interface AIEntityFieldsGenerationRequest {
  worldId: string;
  templateId: string;  // Required for entity field generation
  entityName?: string;
  prompt?: string;
  existingFields?: Record<string, unknown>;
  generateAllFields?: boolean;
  specificField?: string;
}

export interface AIEntityFieldsGenerationResponse {
  fields: Record<string, unknown>;
}

export interface AIImageGenerationRequest {
  worldId: string;
  type: 'entity' | 'world-cover';
  prompt: string;
  artStyle?: import('./artStyles').ArtStyle;
  entityName?: string;
  templateName?: string;
  entityFields?: Record<string, unknown>;
  worldName?: string;
  worldDescription?: string;
  style?: 'natural' | 'vivid';
  size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  quality?: 'standard' | 'high';
}

export interface AIImageGenerationResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

export interface AIEntitySummaryGenerationRequest {
  worldId: string;
  entityId: string;
  customPrompt?: string;
}

export interface AIEntitySummaryGenerationResponse {
  summary: string;
}

export interface AIEntitySummaryPreviewRequest {
  worldId: string;
  templateId: string;
  entityName: string;
  entityFields: Record<string, unknown>;
  customPrompt?: string;
}

export interface AIEntitySummaryPreviewResponse {
  summary: string;
}

export interface AIWorldFieldsGenerationRequest {
  worldId?: string;
  prompt?: string;
  fieldsToGenerate: string[]; // Array of field names to generate
  existingData?: Partial<{
    name: string;
    logline: string;
    genreBlend: string[];
    overallTone: string;
    keyThemes: string[];
    audienceRating: string;
    scopeScale: string;
    technologyLevel: string[];
    magicLevel: string[];
    cosmologyModel: string;
    climateBiomes: string[];
    calendarTimekeeping: string;
    societalOverview: string;
    conflictDrivers: string[];
    rulesConstraints: string;
    aestheticDirection: string;
  }>;
}

export interface AIWorldFieldsGenerationResponse {
  fields: Record<string, unknown>;
}

// ==============================================
// MAP GENERATION TYPES
// ==============================================

// Map generation enums matching database enums
export type MapPurpose =
  | 'campaign_overview'        // Campaign overview / world atlas
  | 'regional_adventuring'     // Regional adventuring (quests & travel)
  | 'local_exploration'        // Local exploration (hex crawl)
  | 'political_boundaries'     // Political boundaries & factions
  | 'trade_logistics'          // Trade & logistics
  | 'war_operations';          // War & military operations

export type MapScale =
  | 'world_continent'          // World / continent
  | 'large_region'             // Large region (500–1500 km)
  | 'province_kingdom'         // Province / kingdom (150–500 km)
  | 'local_area'               // Local area (25–150 km)
  | 'town_surroundings';       // Town + surroundings (1–25 km)

export type SettlementDensity =
  | 'sparse_nomadic'           // Sparse nomadic / pre-agrarian
  | 'rural_agrarian'           // Rural agrarian with few towns
  | 'feudal_kingdoms'          // Feudal kingdoms with walled cities
  | 'late_medieval'            // Late-medieval / early gunpowder
  | 'early_industrial';        // Early industrial / steampunk

export type PoliticalComplexity =
  | 'minimal'                  // Minimal (1–2 realms)
  | 'moderate'                 // Moderate (3–6 realms)
  | 'high';                    // High (7+ realms, enclaves, vassals)

export type MapVisualStyle =
  | 'inked_atlas'              // Inked atlas (lines & hatching)
  | 'painterly'                // Painterly/illustrated
  | 'hex_map'                  // Hex map (grid & symbols)
  | 'minimal_modern'           // Minimal modern
  | 'nautical_chart';          // Nautical chart

// Genre options for maps
export type GenreTag =
  | 'high_fantasy'
  | 'low_grim_fantasy'
  | 'post_apocalyptic'
  | 'sword_sorcery'
  | 'historical_alt_history'
  | 'science_fantasy';

// Terrain emphasis options
export type TerrainEmphasis =
  | 'mountains'                // Mountain chains & highlands
  | 'rivers'                   // River systems & wetlands
  | 'forests'                  // Forests & jungles
  | 'deserts'                  // Deserts & badlands
  | 'coasts'                   // Coasts & archipelagos
  | 'grasslands';              // Grasslands & steppes

// Climate zone options
export type ClimateZone =
  | 'tropical'                 // Tropical/humid
  | 'subtropical'              // Subtropical/savanna
  | 'temperate'                // Temperate (four seasons)
  | 'arid'                     // Arid/desert
  | 'boreal'                   // Boreal/taiga
  | 'polar';                   // Polar/tundra

// Travel focus options
export type TravelFocus =
  | 'overland_roads'           // Overland roads & caravans
  | 'river_travel'             // River travel & ferries
  | 'coastal_shipping'         // Coastal shipping/sea lanes
  | 'wilderness_treks'         // Wilderness treks/off-road
  | 'air_arcane';              // Air/arcane travel corridors

// Signature feature options
export type SignatureFeature =
  | 'great_wall'               // Great wall/pass choke point
  | 'world_scar'               // World-scar canyon/fault
  | 'volcano_chain'            // Active volcano chain
  | 'inland_sea'               // Giant inland sea/delta
  | 'floating_isles'           // Floating/levitating isles
  | 'megadungeon';             // Megadungeon/ancient ruin zone

// Map generation request interface
export interface AIMapGenerationRequest {
  worldId: string;
  name: string;
  description?: string;

  // Core generation parameters
  mapPurpose: MapPurpose;
  mapScale: MapScale;
  genreTags: GenreTag[];
  terrainEmphasis: TerrainEmphasis[];
  climateZones: ClimateZone[];
  settlementDensity: SettlementDensity;
  politicalComplexity: PoliticalComplexity;
  travelFocus: TravelFocus[];
  signatureFeatures: SignatureFeature[];
  visualStyle: MapVisualStyle;

  // Optional context
  contextEntityIds?: string[];
  customPrompt?: string;
}

export interface AIMapGenerationResponse {
  mapId: string;
  imageUrl: string;
  revisedPrompt?: string;
  generationSettings: {
    mapPurpose: MapPurpose;
    mapScale: MapScale;
    genreTags: GenreTag[];
    terrainEmphasis: TerrainEmphasis[];
    climateZones: ClimateZone[];
    settlementDensity: SettlementDensity;
    politicalComplexity: PoliticalComplexity;
    travelFocus: TravelFocus[];
    signatureFeatures: SignatureFeature[];
    visualStyle: MapVisualStyle;
  };
}

// Map generation form validation types
export interface MapGenerationFormData {
  // Basic fields
  name: string;
  description?: string;
  mode: 'upload' | 'ai';

  // Upload mode fields
  imageFile?: File;
  scale?: {
    value: number;
    unit: 'km' | 'miles' | 'meters' | 'feet';
  };

  // AI generation fields
  mapPurpose?: MapPurpose;
  mapScale?: MapScale;
  genreTags?: GenreTag[];
  terrainEmphasis?: TerrainEmphasis[];
  climateZones?: ClimateZone[];
  settlementDensity?: SettlementDensity;
  politicalComplexity?: PoliticalComplexity;
  travelFocus?: TravelFocus[];
  signatureFeatures?: SignatureFeature[];
  visualStyle?: MapVisualStyle;

  // Context fields
  contextEntityIds?: string[];
  customPrompt?: string;

  // Layer options
  createDefaultLayers?: boolean;
  createTerrainLayer?: boolean;
  createPoliticalLayer?: boolean;
  createMarkersLayer?: boolean;

  // Output options
  exportFormat?: 'png' | 'json' | 'both';
  gridType?: 'none' | 'square' | 'hex';
  gridSize?: number;
}

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
  // Shared world metadata
  userRole?: MemberRole; // Current user's role in this world
  isShared?: boolean; // True if user is not the owner
  ownerName?: string; // Name of the world owner (for shared worlds)
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
  kind: FolderKind; // Required - exists in database schema with default 'entities'
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
  requireForAIContext?: boolean;
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
  summary?: string; // Maps to summary column in database
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
  strength?: number; // 1-10 scale, default 5
  isBidirectional?: boolean; // Maps to is_bidirectional in database
  createdAt?: string; // From database schema
  updatedAt?: string; // From database schema
};
