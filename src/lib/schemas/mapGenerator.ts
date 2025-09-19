import { z } from 'zod';
import type {
  MapPurpose,
  MapScale,
  GenreTag,
  TerrainEmphasis,
  ClimateZone,
  SettlementDensity,
  PoliticalComplexity,
  TravelFocus,
  SignatureFeature,
  MapVisualStyle
} from '@/lib/types';

// Define enum value arrays for validation
const mapPurposeValues: MapPurpose[] = [
  'campaign_overview',
  'regional_adventuring',
  'local_exploration',
  'political_boundaries',
  'trade_logistics',
  'war_operations'
];

const mapScaleValues: MapScale[] = [
  'world_continent',
  'large_region',
  'province_kingdom',
  'local_area',
  'town_surroundings'
];

const genreTagValues: GenreTag[] = [
  'high_fantasy',
  'low_grim_fantasy',
  'post_apocalyptic',
  'sword_sorcery',
  'historical_alt_history',
  'science_fantasy'
];

const terrainEmphasisValues: TerrainEmphasis[] = [
  'mountains',
  'rivers',
  'forests',
  'deserts',
  'coasts',
  'grasslands'
];

const climateZoneValues: ClimateZone[] = [
  'tropical',
  'subtropical',
  'temperate',
  'arid',
  'boreal',
  'polar'
];

const settlementDensityValues: SettlementDensity[] = [
  'sparse_nomadic',
  'rural_agrarian',
  'feudal_kingdoms',
  'late_medieval',
  'early_industrial'
];

const politicalComplexityValues: PoliticalComplexity[] = [
  'minimal',
  'moderate',
  'high'
];

const travelFocusValues: TravelFocus[] = [
  'overland_roads',
  'river_travel',
  'coastal_shipping',
  'wilderness_treks',
  'air_arcane'
];

const signatureFeatureValues: SignatureFeature[] = [
  'great_wall',
  'world_scar',
  'volcano_chain',
  'inland_sea',
  'floating_isles',
  'megadungeon'
];

const mapVisualStyleValues: MapVisualStyle[] = [
  'inked_atlas',
  'painterly',
  'hex_map',
  'minimal_modern',
  'nautical_chart'
];

// Base schema without refinements for extension purposes
export const mapGeneratorBaseSchema = z.object({
  // Basic info
  worldId: z.string().min(1, 'World ID is required'),
  name: z.string().min(1, 'Map name is required').max(100, 'Map name must be under 100 characters'),
  mode: z.enum(['upload', 'ai'], { required_error: 'Mode is required' }),
  description: z.string().optional(),

  // Upload mode fields
  imageFile: z.instanceof(File).optional(),
  scale: z.object({
    value: z.number().min(0.1, 'Scale must be at least 0.1').max(1000, 'Scale must be under 1000'),
    unit: z.enum(['km', 'miles', 'meters', 'feet'], { required_error: 'Scale unit is required' })
  }).optional(),

  // Grid options
  gridType: z.enum(['none', 'square', 'hex']).default('none'),
  gridSize: z.number().min(10, 'Grid size must be at least 10px').max(200, 'Grid size must be under 200px').optional(),

  // Upload mode layers
  createDefaultLayers: z.boolean().default(true),
  createTerrainLayer: z.boolean().default(true),
  createPoliticalLayer: z.boolean().default(true),
  createMarkersLayer: z.boolean().default(true),

  // AI mode fields - comprehensive world map generation
  mapPurpose: z.enum(mapPurposeValues as [MapPurpose, ...MapPurpose[]], {
    required_error: 'Map purpose is required for AI generation'
  }).optional(),

  mapScale: z.enum(mapScaleValues as [MapScale, ...MapScale[]], {
    required_error: 'Map scale is required for AI generation'
  }).optional(),

  genreTags: z.array(z.enum(genreTagValues as [GenreTag, ...GenreTag[]])).optional(),
  terrainEmphasis: z.array(z.enum(terrainEmphasisValues as [TerrainEmphasis, ...TerrainEmphasis[]])).optional(),
  climateZones: z.array(z.enum(climateZoneValues as [ClimateZone, ...ClimateZone[]])).optional(),

  settlementDensity: z.enum(settlementDensityValues as [SettlementDensity, ...SettlementDensity[]], {
    required_error: 'Settlement density is required for AI generation'
  }).optional(),

  politicalComplexity: z.enum(politicalComplexityValues as [PoliticalComplexity, ...PoliticalComplexity[]], {
    required_error: 'Political complexity is required for AI generation'
  }).optional(),

  travelFocus: z.array(z.enum(travelFocusValues as [TravelFocus, ...TravelFocus[]])).optional(),
  signatureFeatures: z.array(z.enum(signatureFeatureValues as [SignatureFeature, ...SignatureFeature[]])).optional(),

  visualStyle: z.enum(mapVisualStyleValues as [MapVisualStyle, ...MapVisualStyle[]], {
    required_error: 'Visual style is required for AI generation'
  }).optional(),

  // Legacy AI fields for backward compatibility
  mapType: z.enum(['world', 'region', 'settlement', 'site', 'dungeon']).optional(),
  artStyle: z.enum(['photorealistic', 'hand-drawn']).optional(),
  viewAngle: z.enum(['top-down', 'isometric']).optional(),
  aspectRatioAI: z.enum(['square', 'vertical', 'landscape']).optional(),


  // Linking and output options
  autoCreateEntityCards: z.boolean().default(false),
  autoLinkMarkers: z.boolean().default(false),
  exportFormat: z.enum(['png', 'jpg', 'webp']).default('png'),
  splitLabelsLayer: z.boolean().default(false),

});

export const mapGeneratorSchema = mapGeneratorBaseSchema.refine((data) => {
  // Upload mode validation
  if (data.mode === 'upload') {
    if (!data.imageFile) {
      return false;
    }
    if (!data.scale) {
      return false;
    }
    return true;
  }

  // AI mode validation - comprehensive world map requirements
  if (data.mode === 'ai') {
    // Required fields for new AI mode
    if (!data.mapPurpose) {
      return false;
    }
    if (!data.mapScale) {
      return false;
    }
    if (!data.genreTags || data.genreTags.length === 0) {
      return false;
    }
    if (!data.terrainEmphasis || data.terrainEmphasis.length === 0) {
      return false;
    }
    if (!data.climateZones || data.climateZones.length === 0) {
      return false;
    }
    if (!data.settlementDensity) {
      return false;
    }
    if (!data.politicalComplexity) {
      return false;
    }
    if (!data.travelFocus || data.travelFocus.length === 0) {
      return false;
    }
    if (!data.visualStyle) {
      return false;
    }
    return true;
  }

  return true;
}, {
  message: "All required fields must be filled for AI generation",
  path: ["mode"]
}).refine((data) => {
  // Grid size validation
  if (data.gridType !== 'none' && !data.gridSize) {
    return false;
  }
  return true;
}, {
  message: "Grid size is required when grid type is selected",
  path: ["gridSize"]
}).refine((data) => {
  // Image file validation for upload mode
  if (data.mode === 'upload' && data.imageFile) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(data.imageFile.type)) {
      return false;
    }
    // Max 50MB
    if (data.imageFile.size > 50 * 1024 * 1024) {
      return false;
    }
  }
  return true;
}, {
  message: "Image must be JPEG, PNG, or WebP and under 50MB",
  path: ["imageFile"]
});

export type MapGeneratorFormData = z.infer<typeof mapGeneratorSchema>;

// Default values for the form
export const mapGeneratorDefaults = {
  mode: 'ai' as const, // Changed default to AI since that's the main feature
  gridType: 'none' as const,
  createDefaultLayers: true,
  createTerrainLayer: true,
  createPoliticalLayer: true,
  createMarkersLayer: true,
  autoCreateEntityCards: false,
  autoLinkMarkers: false,
  exportFormat: 'png' as const,
  splitLabelsLayer: false,
  scale: {
    value: 1,
    unit: 'km' as const
  },

  // New comprehensive AI generation defaults
  mapPurpose: 'campaign_overview' as const,
  mapScale: 'large_region' as const,
  genreTags: ['high_fantasy'] as GenreTag[],
  terrainEmphasis: ['mountains', 'forests'] as TerrainEmphasis[],
  climateZones: ['temperate'] as ClimateZone[],
  settlementDensity: 'feudal_kingdoms' as const,
  politicalComplexity: 'moderate' as const,
  travelFocus: ['overland_roads'] as TravelFocus[],
  signatureFeatures: [] as SignatureFeature[],
  visualStyle: 'painterly' as const,

  // Legacy AI fields (keeping for backward compatibility)
  mapType: 'world' as const,
  artStyle: 'photorealistic' as const,
  viewAngle: 'top-down' as const,
  aspectRatioAI: 'square' as const,

};

// Helper types for form sections
export type UploadModeFields = Pick<MapGeneratorFormData,
  'imageFile' | 'scale' | 'gridType' | 'gridSize' | 'createDefaultLayers' |
  'createTerrainLayer' | 'createPoliticalLayer' | 'createMarkersLayer'
>;

export type AIModeFields = Pick<MapGeneratorFormData,
  'mapPurpose' | 'mapScale' | 'genreTags' | 'terrainEmphasis' | 'climateZones' |
  'settlementDensity' | 'politicalComplexity' | 'travelFocus' | 'signatureFeatures' |
  'visualStyle'
>;

export type LegacyAIModeFields = Pick<MapGeneratorFormData,
  'mapType' | 'artStyle' | 'viewAngle' | 'aspectRatioAI'
>;

export type LinkingFields = Pick<MapGeneratorFormData,
  'autoCreateEntityCards' | 'autoLinkMarkers'
>;

export type OutputFields = Pick<MapGeneratorFormData,
  'exportFormat' | 'splitLabelsLayer'
>;

// Export value arrays for use in UI components
export {
  mapPurposeValues,
  mapScaleValues,
  genreTagValues,
  terrainEmphasisValues,
  climateZoneValues,
  settlementDensityValues,
  politicalComplexityValues,
  travelFocusValues,
  signatureFeatureValues,
  mapVisualStyleValues
};