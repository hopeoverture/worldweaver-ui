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

    const { worldService } = await import('@/lib/services/worldService')
    const world = await worldService.getWorldById(params.id, user.id)
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

    // Map description -> summary for service layer
    const data: Partial<World> = {}
    if (parsed.name !== undefined) data.name = parsed.name
    if (parsed.description !== undefined) data.summary = parsed.description
    if (parsed.isPublic !== undefined) data.isPublic = parsed.isPublic
    if (parsed.isArchived !== undefined) data.isArchived = parsed.isArchived

    const { worldService } = await import('@/lib/services/worldService')
    const updated = await worldService.updateWorld(params.id, data, user.id)
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

    const { worldService } = await import('@/lib/services/worldService')
    await worldService.deleteWorld(params.id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    safeConsoleError('Error deleting world', error as Error, { action: 'DELETE_world', worldId: params?.id, userId: user?.id })
    return NextResponse.json({ error: 'Failed to delete world' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
