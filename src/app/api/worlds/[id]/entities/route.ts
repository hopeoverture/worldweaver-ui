import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { safeConsoleError } from '@/lib/logging'
import { ActivityLogger } from '@/lib/activity-logger'
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

    const { entityService } = await import('@/lib/services/entityService')
    const entities = await entityService.getWorldEntities(params.id, user.id)
    return NextResponse.json({ entities })
  } catch (error) {
    safeConsoleError('Error fetching entities', error as Error, { action: 'GET_entities', worldId: params?.id, userId: user?.id })
    return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 })
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
      name: z.string().min(1).max(200),
      templateId: z.string().uuid().optional(),
      folderId: z.string().uuid().optional().or(z.literal('')),
      fields: z.record(z.unknown()).default({}),
      tags: z.array(z.string()).optional(),
      imageUrl: z.string().url().optional(),
    })

    let body: z.infer<typeof schema>
    try {
      const json = await req.json()
      body = schema.parse(json)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', issues: e.issues }, { status: 400 })
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { entityService } = await import('@/lib/services/entityService')
    const entity = await entityService.createEntity(params.id, {
      name: body.name,
      templateId: body.templateId,
      folderId: body.folderId || undefined,
      fields: body.fields,
      tags: body.tags,
      imageUrl: body.imageUrl,
    }, user.id)

    // Log entity creation activity
    try {
      const { supabaseWorldService } = await import('@/lib/services/supabaseWorldService')
      const world = await supabaseWorldService.getWorldById(params.id, user.id)
      if (world) {
        ActivityLogger.entityCreated(user.id, entity.name, entity.id, world.id, world.name)
      }
    } catch (error) {
      // Silent failure for activity logging
      console.warn('Failed to log entity creation activity:', error)
    }

    return NextResponse.json({ entity })
  } catch (error) {
    safeConsoleError('Error creating entity', error as Error, { action: 'POST_entities', worldId: params?.id, userId: user?.id })
    return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 })
  }
}
