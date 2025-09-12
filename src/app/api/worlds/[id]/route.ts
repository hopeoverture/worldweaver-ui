import { NextRequest, NextResponse } from 'next/server'
import type { World } from '@/lib/types'
import { getServerAuth } from '@/lib/auth/server'
import { safeConsoleError } from '@/lib/logging'
import { z } from 'zod'

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

    const { supabaseWorldService } = await import('@/lib/services/supabaseWorldService')
    const world = await supabaseWorldService.getWorldById(params.id, user.id)
    if (!world) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ world })
  } catch (error) {
    safeConsoleError('Error fetching world by id', error as Error, { action: 'GET_world', worldId: params?.id, userId: user?.id })
    return NextResponse.json({ error: 'Failed to fetch world' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let params: { id: string } | undefined
  let user: any
  try {
    params = await ctx.params
    const { user: authUser, error: authError } = await getServerAuth()
    user = authUser
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate request body with zod (partial update)
    const schema = z.object({
      name: z.string().min(1, 'name cannot be empty').max(200).optional(),
      description: z.string().max(5000).optional(),
      isPublic: z.boolean().optional(),
      isArchived: z.boolean().optional(),
      // Extended world creation fields
      logline: z.string().optional(),
      genreBlend: z.array(z.string()).optional(),
      overallTone: z.string().optional(),
      keyThemes: z.array(z.string()).optional(),
      audienceRating: z.string().optional(),
      scopeScale: z.string().optional(),
      technologyLevel: z.array(z.string()).optional(),
      magicLevel: z.array(z.string()).optional(),
      cosmologyModel: z.string().optional(),
      climateBiomes: z.array(z.string()).optional(),
      calendarTimekeeping: z.string().optional(),
      societalOverview: z.string().optional(),
      conflictDrivers: z.array(z.string()).optional(),
      rulesConstraints: z.string().optional(),
      aestheticDirection: z.string().optional(),
      // Invite link settings
      inviteLinkEnabled: z.boolean().optional(),
    })

    let parsed
    try {
      const json = await req.json()
      parsed = schema.parse(json)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const issues = err.issues.map((i) => ({ path: Array.isArray(i.path) ? i.path.join('.') : '', message: i.message }))
        return NextResponse.json({ error: 'Invalid request body', issues }, { status: 400 })
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!parsed || Object.keys(parsed).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    // Map request fields to World type (API uses description, domain model uses summary)
    const data: Partial<World> = {}
    if (parsed.name !== undefined) data.name = parsed.name
    if (parsed.description !== undefined) data.summary = parsed.description
    if (parsed.isPublic !== undefined) data.isPublic = parsed.isPublic
    if (parsed.isArchived !== undefined) data.isArchived = parsed.isArchived
    // Extended world fields
    if (parsed.logline !== undefined) data.logline = parsed.logline
    if (parsed.genreBlend !== undefined) data.genreBlend = parsed.genreBlend
    if (parsed.overallTone !== undefined) data.overallTone = parsed.overallTone
    if (parsed.keyThemes !== undefined) data.keyThemes = parsed.keyThemes
    if (parsed.audienceRating !== undefined) data.audienceRating = parsed.audienceRating
    if (parsed.scopeScale !== undefined) data.scopeScale = parsed.scopeScale
    if (parsed.technologyLevel !== undefined) data.technologyLevel = parsed.technologyLevel
    if (parsed.magicLevel !== undefined) data.magicLevel = parsed.magicLevel
    if (parsed.cosmologyModel !== undefined) data.cosmologyModel = parsed.cosmologyModel
    if (parsed.climateBiomes !== undefined) data.climateBiomes = parsed.climateBiomes
    if (parsed.calendarTimekeeping !== undefined) data.calendarTimekeeping = parsed.calendarTimekeeping
    if (parsed.societalOverview !== undefined) data.societalOverview = parsed.societalOverview
    if (parsed.conflictDrivers !== undefined) data.conflictDrivers = parsed.conflictDrivers
    if (parsed.rulesConstraints !== undefined) data.rulesConstraints = parsed.rulesConstraints
    if (parsed.aestheticDirection !== undefined) data.aestheticDirection = parsed.aestheticDirection
    // Invite link settings
    if (parsed.inviteLinkEnabled !== undefined) data.inviteLinkEnabled = parsed.inviteLinkEnabled

    const { supabaseWorldService } = await import('@/lib/services/supabaseWorldService')
    const updated = await supabaseWorldService.updateWorld(params.id, data, user.id)
    return NextResponse.json({ world: updated })
  } catch (error) {
    safeConsoleError('Error updating world', error as Error, { action: 'PUT_world', worldId: params?.id, userId: user?.id })
    return NextResponse.json({ error: 'Failed to update world' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let params: { id: string } | undefined
  let user: any
  try {
    params = await ctx.params
    const { user: authUser, error: authError } = await getServerAuth()
    user = authUser
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { supabaseWorldService } = await import('@/lib/services/supabaseWorldService')
    await supabaseWorldService.deleteWorld(params.id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    safeConsoleError('Error deleting world', error as Error, { action: 'DELETE_world', worldId: params?.id, userId: user?.id })
    return NextResponse.json({ error: 'Failed to delete world' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
