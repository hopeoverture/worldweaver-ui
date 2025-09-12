import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { z } from 'zod'
import { 
  apiSuccess, 
  apiAuthRequired,
  parseRequestBody,
  withApiErrorHandling,
  generateRequestId
} from '@/lib/api-utils'
import { RelationshipResponse } from '@/lib/api-types'

export const dynamic = 'force-dynamic'

const updateRelationshipSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

export const PUT = withApiErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse<RelationshipResponse>> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  
  if (authError || !user) {
    return apiAuthRequired()
  }

  const result = await parseRequestBody(req, updateRelationshipSchema)
  if ('error' in result) {
    return result.error
  }

  const { unifiedService: worldService } = await import('@/lib/services')
  const relationship = await worldService.updateRelationship(
    params.id,
    {
      label: result.label,
      description: result.description ?? undefined,
      metadata: result.metadata ?? undefined,
    },
    user.id,
  )
  
  // Map database fields to API response format
  const responseData = {
    id: relationship.id,
    worldId: relationship.worldId,
    fromEntityId: relationship.from,
    toEntityId: relationship.to,
    label: relationship.label,
    description: relationship.description ?? undefined,
    metadata: relationship.metadata as Record<string, unknown> | undefined,
    createdAt: relationship.createdAt,
    updatedAt: relationship.updatedAt,
  }
  
  return apiSuccess(responseData, { 'X-Request-ID': requestId })
})

export const DELETE = withApiErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  
  if (authError || !user) {
    return apiAuthRequired()
  }

  const { unifiedService: worldService } = await import('@/lib/services')
  await worldService.deleteRelationship(params.id, user.id)
  
  return apiSuccess({ ok: true }, { 'X-Request-ID': requestId })
})

