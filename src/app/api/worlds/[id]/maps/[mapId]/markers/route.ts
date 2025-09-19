import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { safeConsoleError } from '@/lib/logging'
import { mapService } from '@/lib/services/mapService'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string; mapId: string }> }) {
  let params: { id: string; mapId: string } | undefined
  let user: any
  try {
    params = await ctx.params
    const { user: authUser, error: authError } = await getServerAuth()
    user = authUser
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get markers from the v_map_markers view which includes entity data
    const markers = await mapService.getMapMarkers(params.mapId)

    // Transform the marker data for the frontend
    const transformedMarkers = markers.map((marker: any) => ({
      id: marker.id,
      x: marker.x,
      y: marker.y,
      title: marker.title || 'Untitled Marker',
      subtitle: marker.subtitle,
      description: marker.description,
      color: marker.color || '#ef4444',
      icon: marker.icon,
      entity_id: marker.entity_id,
      entity_name: marker.entity_name,
      entity_template_id: marker.entity_template_id,
      entity_template_name: marker.entity_template_name,
      layer_name: marker.layer_name,
      layer_kind: marker.layer_kind,
      layer_visible: marker.layer_visible,
      metadata: marker.metadata || {}
    }))

    // Filter out markers from invisible layers
    const visibleMarkers = transformedMarkers.filter((marker: any) => marker.layer_visible)

    return NextResponse.json({
      markers: visibleMarkers,
      total: visibleMarkers.length
    })
  } catch (error) {
    safeConsoleError('Error fetching map markers', error as Error, {
      action: 'GET_map_markers',
      worldId: params?.id,
      mapId: params?.mapId,
      userId: user?.id
    })
    return NextResponse.json({ error: 'Failed to fetch map markers' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'