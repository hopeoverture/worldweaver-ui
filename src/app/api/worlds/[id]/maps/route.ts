import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { safeConsoleError } from '@/lib/logging'
import { z } from 'zod'
import { mapService } from '@/lib/services/mapService'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let params: { id: string } | undefined
  let user: any
  try {
    params = await ctx.params
    const { user: authUser, error: authError } = await getServerAuth()
    user = authUser
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const maps = await mapService.getWorldMaps(params.id, user.id)
    return NextResponse.json({ maps })
  } catch (error) {
    safeConsoleError('Error fetching maps', error as Error, {
      action: 'GET_maps',
      worldId: params?.id,
      userId: user?.id
    })
    return NextResponse.json({ error: 'Failed to fetch maps' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let params: { id: string } | undefined
  let user: any
  try {
    params = await ctx.params
    const { user: authUser, error: authError } = await getServerAuth()
    user = authUser
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const schema = z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(500).optional(),
      image_path: z.string().optional(),
      width_px: z.number().min(1).max(10000),
      height_px: z.number().min(1).max(10000),
      pixels_per_unit: z.number().min(0.1).max(1000).optional(),
      default_zoom: z.number().min(0.1).max(5).optional(),
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

    const result = await mapService.createMapWithLayers(params.id, body, user.id)

    return NextResponse.json({
      map: result.map,
      layers: result.layers
    })
  } catch (error) {
    safeConsoleError('Error creating map', error as Error, {
      action: 'POST_maps',
      worldId: params?.id,
      userId: user?.id
    })
    return NextResponse.json({ error: 'Failed to create map' }, { status: 500 })
  }
}