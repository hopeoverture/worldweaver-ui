import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { safeConsoleError } from '@/lib/logging'
import { z } from 'zod'
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

    const map = await mapService.getMapById(params.mapId)
    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }

    // Check if user has access to this map (either owner or world member)
    if (map.created_by !== user.id && !map.is_public) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get map layers and markers
    const [layers, markers] = await Promise.all([
      mapService.getMapLayers(params.mapId),
      mapService.getMapMarkers(params.mapId)
    ])

    return NextResponse.json({
      map,
      layers,
      markers
    })
  } catch (error) {
    safeConsoleError('Error fetching map', error as Error, {
      action: 'GET_map',
      worldId: params?.id,
      mapId: params?.mapId,
      userId: user?.id
    })
    return NextResponse.json({ error: 'Failed to fetch map' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string; mapId: string }> }) {
  let params: { id: string; mapId: string } | undefined
  let user: any
  try {
    params = await ctx.params
    const { user: authUser, error: authError } = await getServerAuth()
    user = authUser
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if map exists and user owns it
    const existingMap = await mapService.getMapById(params.mapId)
    if (!existingMap) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }

    if (existingMap.created_by !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(500).optional(),
      is_public: z.boolean().optional()
    })

    let body: z.infer<typeof schema>
    try {
      body = await req.json()
      body = schema.parse(body)
    } catch (parseError) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: parseError instanceof z.ZodError ? parseError.errors : 'Invalid JSON'
      }, { status: 400 })
    }

    const map = await mapService.updateMap(params.mapId, body)
    return NextResponse.json({ map })
  } catch (error) {
    safeConsoleError('Error updating map', error as Error, {
      action: 'PUT_map',
      worldId: params?.id,
      mapId: params?.mapId,
      userId: user?.id
    })
    return NextResponse.json({ error: 'Failed to update map' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; mapId: string }> }) {
  let params: { id: string; mapId: string } | undefined
  let user: any
  try {
    params = await ctx.params
    const { user: authUser, error: authError } = await getServerAuth()
    user = authUser
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if map exists and user owns it
    const existingMap = await mapService.getMapById(params.mapId)
    if (!existingMap) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }

    if (existingMap.created_by !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await mapService.deleteMap(params.mapId)
    return NextResponse.json({ success: true })
  } catch (error) {
    safeConsoleError('Error deleting map', error as Error, {
      action: 'DELETE_map',
      worldId: params?.id,
      mapId: params?.mapId,
      userId: user?.id
    })
    return NextResponse.json({ error: 'Failed to delete map' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'