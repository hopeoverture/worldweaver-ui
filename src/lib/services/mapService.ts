import { createClient } from '@supabase/supabase-js'
import { getSignedMapUrl } from '@/lib/storage/maps'
import 'server-only'

// Create a server-side Supabase client with service role key
function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for server client')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface Map {
  id: string
  world_id: string
  name: string
  description?: string
  image_path?: string
  width_px: number
  height_px: number
  pixels_per_unit: number
  default_zoom: number
  is_public: boolean
  created_by?: string
  created_at: string
  updated_at: string
  // Comprehensive map generation fields
  map_purpose?: string
  map_scale?: string
  genre_tags?: string[]
  terrain_emphasis?: string[]
  climate_zones?: string[]
  settlement_density?: string
  political_complexity?: string
  travel_focus?: string[]
  signature_features?: string[]
  visual_style?: string
}

export interface MapLayer {
  id: string
  map_id: string
  name: string
  kind: 'markers' | 'regions' | 'paths' | 'labels' | 'fog' | 'gm'
  z_index: number
  visible: boolean
  style: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateMapData {
  name: string
  description?: string
  image_path?: string
  width_px: number
  height_px: number
  pixels_per_unit?: number
  default_zoom?: number
  is_public?: boolean
  // Comprehensive map generation fields
  map_purpose?: string
  map_scale?: string
  genre_tags?: string[]
  terrain_emphasis?: string[]
  climate_zones?: string[]
  settlement_density?: string
  political_complexity?: string
  travel_focus?: string[]
  signature_features?: string[]
  visual_style?: string
}

export interface CreateMapLayerData {
  name: string
  kind: 'markers' | 'regions' | 'paths' | 'labels' | 'fog' | 'gm'
  z_index?: number
  visible?: boolean
  style?: Record<string, any>
}

class MapService {
  private supabase = createServerClient()

  async getWorldMaps(worldId: string, userId: string): Promise<Map[]> {
    const { data, error } = await this.supabase
      .from('maps')
      .select('*')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch world maps: ${error.message}`)
    }

    if (!data) return []

    // Generate signed URLs for map images
    const mapsWithSignedUrls = await Promise.all(
      data.map(async (map) => {
        if (map.image_path) {
          try {
            const { signedUrl, error: urlError } = await getSignedMapUrl(map.image_path, 3600)
            if (!urlError && signedUrl) {
              return { ...map, image_path: signedUrl }
            } else {
              console.warn(`Failed to generate signed URL for map ${map.id}:`, urlError?.message)
              // Keep the original path as fallback (might be a public URL)
              return map
            }
          } catch (error) {
            console.warn(`Error generating signed URL for map ${map.id}:`, error)
            return map
          }
        }
        return map
      })
    )

    return mapsWithSignedUrls
  }

  async getMapById(mapId: string): Promise<Map | null> {
    const { data, error } = await this.supabase
      .from('maps')
      .select('*')
      .eq('id', mapId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch map: ${error.message}`)
    }

    if (!data) return null

    // Generate signed URL for map image if it exists
    if (data.image_path) {
      try {
        const { signedUrl, error: urlError } = await getSignedMapUrl(data.image_path, 3600)
        if (!urlError && signedUrl) {
          return { ...data, image_path: signedUrl }
        } else {
          console.warn(`Failed to generate signed URL for map ${data.id}:`, urlError?.message)
        }
      } catch (error) {
        console.warn(`Error generating signed URL for map ${data.id}:`, error)
      }
    }

    return data
  }

  async createMap(worldId: string, mapData: CreateMapData, userId: string): Promise<Map> {
    const { data, error } = await this.supabase
      .from('maps')
      .insert({
        world_id: worldId,
        name: mapData.name,
        description: mapData.description,
        image_path: mapData.image_path,
        width_px: mapData.width_px,
        height_px: mapData.height_px,
        pixels_per_unit: mapData.pixels_per_unit || 50.0,
        default_zoom: mapData.default_zoom || 1.0,
        is_public: mapData.is_public || false,
        created_by: userId,
        // Comprehensive map generation fields
        map_purpose: mapData.map_purpose,
        map_scale: mapData.map_scale,
        genre_tags: mapData.genre_tags,
        terrain_emphasis: mapData.terrain_emphasis,
        climate_zones: mapData.climate_zones,
        settlement_density: mapData.settlement_density,
        political_complexity: mapData.political_complexity,
        travel_focus: mapData.travel_focus,
        signature_features: mapData.signature_features,
        visual_style: mapData.visual_style
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create map: ${error.message}`)
    }

    return data
  }

  async updateMap(mapId: string, mapData: Partial<CreateMapData>): Promise<Map> {
    const { data, error } = await this.supabase
      .from('maps')
      .update({
        ...mapData,
        updated_at: new Date().toISOString()
      })
      .eq('id', mapId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update map: ${error.message}`)
    }

    return data
  }

  async deleteMap(mapId: string): Promise<void> {
    const { error } = await this.supabase
      .from('maps')
      .delete()
      .eq('id', mapId)

    if (error) {
      throw new Error(`Failed to delete map: ${error.message}`)
    }
  }

  async getMapLayers(mapId: string): Promise<MapLayer[]> {
    const { data, error } = await this.supabase
      .from('map_layers')
      .select('*')
      .eq('map_id', mapId)
      .order('z_index', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch map layers: ${error.message}`)
    }

    return data || []
  }

  async createMapLayer(mapId: string, layerData: CreateMapLayerData): Promise<MapLayer> {
    const { data, error } = await this.supabase
      .from('map_layers')
      .insert({
        map_id: mapId,
        name: layerData.name,
        kind: layerData.kind,
        z_index: layerData.z_index || 0,
        visible: layerData.visible !== false,
        style: layerData.style || {}
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create map layer: ${error.message}`)
    }

    return data
  }

  async createDefaultLayers(mapId: string): Promise<MapLayer[]> {
    const defaultLayers: CreateMapLayerData[] = [
      { name: 'Markers', kind: 'markers', z_index: 10, visible: true },
      { name: 'Regions', kind: 'regions', z_index: 5, visible: true },
      { name: 'Paths', kind: 'paths', z_index: 8, visible: true },
      { name: 'Labels', kind: 'labels', z_index: 15, visible: true }
    ]

    const layers: MapLayer[] = []
    for (const layerData of defaultLayers) {
      const layer = await this.createMapLayer(mapId, layerData)
      layers.push(layer)
    }

    return layers
  }

  async createMapWithLayers(
    worldId: string,
    mapData: CreateMapData,
    userId: string
  ): Promise<{ map: Map; layers: MapLayer[] }> {
    // Create the map first
    const map = await this.createMap(worldId, mapData, userId)

    // Create default layers
    const layers = await this.createDefaultLayers(map.id)

    return { map, layers }
  }

  async getMapMarkers(mapId: string) {
    const { data, error } = await this.supabase
      .from('v_map_markers')
      .select('*')
      .eq('map_id', mapId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch map markers: ${error.message}`)
    }

    return data || []
  }

  async createMapMarker(layerId: string, markerData: {
    x: number
    y: number
    title: string
    subtitle?: string
    description?: string
    icon?: string
    color?: string
    entity_id?: string
    metadata?: Record<string, any>
  }, userId: string) {
    const { data, error } = await this.supabase
      .from('map_markers')
      .insert({
        layer_id: layerId,
        x: markerData.x,
        y: markerData.y,
        title: markerData.title,
        subtitle: markerData.subtitle,
        description: markerData.description,
        icon: markerData.icon,
        color: markerData.color || '#ef4444',
        entity_id: markerData.entity_id,
        metadata: markerData.metadata || {},
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create map marker: ${error.message}`)
    }

    return data
  }

  /**
   * Get world data for AI context
   */
  async getWorldForContext(worldId: string) {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('worlds')
      .select('name, description, genre_blend, overall_tone, key_themes')
      .eq('id', worldId)
      .single()

    if (error) {
      console.warn('Failed to fetch world context:', error)
      return null
    }

    if (!data) return null

    // Convert snake_case database fields to camelCase for the domain
    return {
      name: data.name,
      description: data.description,
      genreBlend: data.genre_blend,
      overallTone: data.overall_tone,
      keyThemes: data.key_themes
    }
  }

  /**
   * Get entity names for AI context
   */
  async getEntitiesForContext(entityIds: string[]) {
    if (!entityIds.length) return []

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('entities')
      .select('id, name')
      .in('id', entityIds)

    if (error) {
      console.warn('Failed to fetch entities for context:', error)
      return []
    }

    return data || []
  }
}

export const mapService = new MapService()