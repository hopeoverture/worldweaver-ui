import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { z } from 'zod'
import {
  apiSuccess,
  apiAuthRequired,
  apiNotFound,
  parseRequestBody,
  withApiErrorHandling,
  generateRequestId
} from '@/lib/api-utils'
import { EntityResponse } from '@/lib/api-types'
import { logApiError } from '@/lib/logging'
import { ActivityLogger } from '@/lib/activity-logger'

export const GET = withApiErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse<EntityResponse>> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  
  if (authError || !user) {
    return apiAuthRequired()
  }

  const { entityService } = await import('@/lib/services/entityService')
  const entity = await entityService.getEntityById(params.id, user.id)
  
  if (!entity) {
    return apiNotFound('Entity')
  }
  
  return apiSuccess(entity, { 'X-Request-ID': requestId })
})

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {

    const schema = z.object({
      name: z.string().min(1).max(200).optional(),
      templateId: z.string().uuid().nullable().optional(),
      folderId: z.string().uuid().nullable().optional().or(z.literal('')),
      fields: z.record(z.unknown()).optional(),
      tags: z.array(z.string()).nullable().optional(),
      imageUrl: z.string().url().nullable().optional(),
      summary: z.string().optional(),
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
    const updated = await entityService.updateEntity(
      params.id,
      {
        name: body.name,
        templateId: body.templateId ?? undefined,
        folderId: body.folderId === '' ? undefined : (body.folderId ?? undefined),
        fields: body.fields,
        tags: body.tags ?? undefined,
        imageUrl: body.imageUrl ?? undefined,
        summary: body.summary,
      },
      user.id,
    )

    // Log entity update activity
    try {
      if (updated.worldId) {
        const { supabaseWorldService } = await import('@/lib/services/supabaseWorldService')
        const world = await supabaseWorldService.getWorldById(updated.worldId, user.id)
        if (world) {
          ActivityLogger.entityUpdated(user.id, updated.name, updated.id, world.id, world.name)
        }
      }
    } catch (error) {
      // Silent failure for activity logging
      console.warn('Failed to log entity update activity:', error)
    }

    return NextResponse.json({ entity: updated })
  } catch (error) {
    logApiError('/api/entities/[id] PUT', error as Error, { entityId: params.id, userId: user.id })
    return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  try {

    const { entityService } = await import('@/lib/services/entityService')
    await entityService.deleteEntity(params.id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    logApiError('/api/entities/[id] DELETE', error as Error, { entityId: params.id, userId: user.id })
    return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

