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
import { simplifiedUnifiedService } from '@/lib/services/unified-service'

export const dynamic = 'force-dynamic'

export const GET = withApiErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse<RelationshipResponse>> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()

  if (authError || !user) {
    return apiAuthRequired()
  }

  const relationship = await simplifiedUnifiedService.relationships.getRelationshipById(params.id, user.id)

  if (!relationship) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Relationship not found'
      }
    }, { status: 404 })
  }

  // Map database fields to API response format
  const responseData = {
    id: relationship.id,
    worldId: relationship.worldId,
    fromEntityId: relationship.from,
    toEntityId: relationship.to,
    relationshipType: relationship.relationshipType,
    description: relationship.description,
    metadata: relationship.metadata as Record<string, unknown> | undefined,
    strength: relationship.strength,
    isBidirectional: relationship.isBidirectional,
    createdAt: relationship.createdAt || '',
    updatedAt: relationship.updatedAt || '',
  }

  return apiSuccess(responseData, { 'X-Request-ID': requestId })
})

const updateRelationshipSchema = z.object({
  relationshipType: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  strength: z.number().int().min(1).max(10).optional(),
  isBidirectional: z.boolean().optional(),
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

  const relationship = await simplifiedUnifiedService.relationships.updateRelationship(
    params.id,
    {
      relationshipType: result.relationshipType,
      description: result.description ?? undefined,
      metadata: (result.metadata as any) ?? undefined,
      strength: result.strength,
      isBidirectional: result.isBidirectional,
    },
    user.id,
  )
  
  // Map database fields to API response format
  const responseData = {
    id: relationship.id,
    worldId: relationship.worldId,
    fromEntityId: relationship.from,
    toEntityId: relationship.to,
    relationshipType: relationship.relationshipType,
    description: relationship.description,
    metadata: relationship.metadata as Record<string, unknown> | undefined,
    strength: relationship.strength,
    isBidirectional: relationship.isBidirectional,
    createdAt: relationship.createdAt || '',
    updatedAt: relationship.updatedAt || '',
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

  await simplifiedUnifiedService.relationships.deleteRelationship(params.id, user.id)
  
  return apiSuccess({ ok: true }, { 'X-Request-ID': requestId })
})

