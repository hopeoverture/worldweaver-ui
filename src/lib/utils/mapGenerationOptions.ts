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
import type { CheckboxOption } from '@/components/ui/CheckboxGroup';
import type { RadioOption } from '@/components/ui/RadioGroup';

// Map Purpose Options
export const mapPurposeOptions: RadioOption[] = [
  {
    value: 'campaign_overview',
    label: 'Campaign overview / world atlas',
    description: 'High-level view for campaign planning and world overview'
  },
  {
    value: 'regional_adventuring',
    label: 'Regional adventuring (quests & travel)',
    description: 'Medium detail for adventure planning and regional exploration'
  },
  {
    value: 'local_exploration',
    label: 'Local exploration (hex crawl)',
    description: 'Detailed local map for hex-based exploration and discovery'
  },
  {
    value: 'political_boundaries',
    label: 'Political boundaries & factions',
    description: 'Focus on territories, borders, and political divisions'
  },
  {
    value: 'trade_logistics',
    label: 'Trade & logistics',
    description: 'Emphasis on trade routes, resources, and economic centers'
  },
  {
    value: 'war_operations',
    label: 'War & military operations',
    description: 'Strategic view for military campaigns and battlefield planning'
  }
];

// Map Scale Options
export const mapScaleOptions: RadioOption[] = [
  {
    value: 'world_continent',
    label: 'World / continent',
    description: 'Massive scale showing entire continents or worlds'
  },
  {
    value: 'large_region',
    label: 'Large region (500–1500 km)',
    description: 'Multi-kingdom regions, large wilderness areas'
  },
  {
    value: 'province_kingdom',
    label: 'Province / kingdom (150–500 km)',
    description: 'Single kingdoms, provinces, or major regions'
  },
  {
    value: 'local_area',
    label: 'Local area (25–150 km)',
    description: 'Counties, duchies, or adventure regions'
  },
  {
    value: 'town_surroundings',
    label: 'Town + surroundings (1–25 km)',
    description: 'Cities, towns, and their immediate surroundings'
  }
];

// Genre Tag Options
export const genreTagOptions: CheckboxOption[] = [
  {
    value: 'high_fantasy',
    label: 'High fantasy',
    description: 'Magic-rich worlds with epic quests and mythical creatures'
  },
  {
    value: 'low_grim_fantasy',
    label: 'Low/grim fantasy',
    description: 'Grounded, gritty worlds with limited magic and harsh realities'
  },
  {
    value: 'post_apocalyptic',
    label: 'Post-apocalyptic',
    description: 'Ruined civilizations and survival in devastated landscapes'
  },
  {
    value: 'sword_sorcery',
    label: 'Sword & sorcery',
    description: 'Pulp adventure with barbarian heroes and dark magic'
  },
  {
    value: 'historical_alt_history',
    label: 'Historical/alt-history',
    description: 'Real or alternate historical settings with period accuracy'
  },
  {
    value: 'science_fantasy',
    label: 'Science-fantasy',
    description: 'Blended technology and magic in fantastical settings'
  }
];

// Terrain Emphasis Options
export const terrainEmphasisOptions: CheckboxOption[] = [
  {
    value: 'mountains',
    label: 'Mountain chains & highlands',
    description: 'Peaks, ridges, high plateaus, and alpine regions'
  },
  {
    value: 'rivers',
    label: 'River systems & wetlands',
    description: 'Rivers, deltas, marshes, swamps, and waterways'
  },
  {
    value: 'forests',
    label: 'Forests & jungles',
    description: 'Dense woodlands, tropical jungles, and woodland realms'
  },
  {
    value: 'deserts',
    label: 'Deserts & badlands',
    description: 'Arid wastelands, sand dunes, and rocky badlands'
  },
  {
    value: 'coasts',
    label: 'Coasts & archipelagos',
    description: 'Shorelines, islands, harbors, and maritime regions'
  },
  {
    value: 'grasslands',
    label: 'Grasslands & steppes',
    description: 'Open plains, prairies, savannas, and rolling hills'
  }
];

// Climate Zone Options
export const climateZoneOptions: CheckboxOption[] = [
  {
    value: 'tropical',
    label: 'Tropical/humid',
    description: 'Hot, wet climates with lush vegetation and monsoons'
  },
  {
    value: 'subtropical',
    label: 'Subtropical/savanna',
    description: 'Warm climates with distinct wet and dry seasons'
  },
  {
    value: 'temperate',
    label: 'Temperate (four seasons)',
    description: 'Moderate climates with distinct seasonal changes'
  },
  {
    value: 'arid',
    label: 'Arid/desert',
    description: 'Dry climates with minimal rainfall and extreme temperatures'
  },
  {
    value: 'boreal',
    label: 'Boreal/taiga',
    description: 'Cold climates with coniferous forests and long winters'
  },
  {
    value: 'polar',
    label: 'Polar/tundra',
    description: 'Frigid climates with permafrost and arctic conditions'
  }
];

// Settlement Density Options
export const settlementDensityOptions: RadioOption[] = [
  {
    value: 'sparse_nomadic',
    label: 'Sparse nomadic / pre-agrarian',
    description: 'Hunter-gatherer societies with temporary settlements'
  },
  {
    value: 'rural_agrarian',
    label: 'Rural agrarian with few towns',
    description: 'Farming communities with scattered villages and market towns'
  },
  {
    value: 'feudal_kingdoms',
    label: 'Feudal kingdoms with walled cities',
    description: 'Medieval-style realms with fortified cities and castle towns'
  },
  {
    value: 'late_medieval',
    label: 'Late-medieval / early gunpowder',
    description: 'Renaissance-era development with emerging technology'
  },
  {
    value: 'early_industrial',
    label: 'Early industrial / steampunk',
    description: 'Industrial revolution technology with steam and machinery'
  }
];

// Political Complexity Options
export const politicalComplexityOptions: RadioOption[] = [
  {
    value: 'minimal',
    label: 'Minimal (1–2 realms)',
    description: 'Simple political structure with few major powers'
  },
  {
    value: 'moderate',
    label: 'Moderate (3–6 realms)',
    description: 'Multiple kingdoms or factions with clear boundaries'
  },
  {
    value: 'high',
    label: 'High (7+ realms, enclaves, vassals)',
    description: 'Complex web of nations, city-states, and dependencies'
  }
];

// Travel Focus Options
export const travelFocusOptions: CheckboxOption[] = [
  {
    value: 'overland_roads',
    label: 'Overland roads & caravans',
    description: 'Land-based trade routes, highways, and caravan paths'
  },
  {
    value: 'river_travel',
    label: 'River travel & ferries',
    description: 'Waterway navigation, river ports, and ferry crossings'
  },
  {
    value: 'coastal_shipping',
    label: 'Coastal shipping/sea lanes',
    description: 'Maritime trade routes, harbors, and naval passages'
  },
  {
    value: 'wilderness_treks',
    label: 'Wilderness treks/off-road',
    description: 'Untamed paths, mountain passes, and exploration routes'
  },
  {
    value: 'air_arcane',
    label: 'Air/arcane travel corridors',
    description: 'Magical or aerial transportation networks'
  }
];

// Signature Feature Options
export const signatureFeatureOptions: CheckboxOption[] = [
  {
    value: 'great_wall',
    label: 'Great wall/pass choke point',
    description: 'Massive fortifications or strategic mountain passes'
  },
  {
    value: 'world_scar',
    label: 'World-scar canyon/fault',
    description: 'Dramatic geological features like great rifts or canyons'
  },
  {
    value: 'volcano_chain',
    label: 'Active volcano chain',
    description: 'Volcanic regions with active peaks and geothermal activity'
  },
  {
    value: 'inland_sea',
    label: 'Giant inland sea/delta',
    description: 'Massive inland bodies of water or river deltas'
  },
  {
    value: 'floating_isles',
    label: 'Floating/levitating isles',
    description: 'Magical floating islands or suspended landmasses'
  },
  {
    value: 'megadungeon',
    label: 'Megadungeon/ancient ruin zone',
    description: 'Vast ancient complexes or ruined civilization sites'
  }
];

// Visual Style Options
export const visualStyleOptions: RadioOption[] = [
  {
    value: 'inked_atlas',
    label: 'Inked atlas (lines & hatching)',
    description: 'Traditional cartographic style with pen and ink techniques'
  },
  {
    value: 'painterly',
    label: 'Painterly/illustrated',
    description: 'Artistic painted style with rich colors and textures'
  },
  {
    value: 'hex_map',
    label: 'Hex map (grid & symbols)',
    description: 'Gaming-focused hexagonal grid with clear symbols'
  },
  {
    value: 'minimal_modern',
    label: 'Minimal modern',
    description: 'Clean, contemporary design with simplified elements'
  },
  {
    value: 'nautical_chart',
    label: 'Nautical chart',
    description: 'Maritime-style charts with depth indicators and navigation aids'
  }
];

// Helper function to get option by value
export function getOptionByValue<T extends { value: string }>(
  options: T[],
  value: string
): T | undefined {
  return options.find(option => option.value === value);
}

// Helper function to get multiple options by values
export function getOptionsByValues<T extends { value: string }>(
  options: T[],
  values: string[]
): T[] {
  return options.filter(option => values.includes(option.value));
}