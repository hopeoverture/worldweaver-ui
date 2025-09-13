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
import { TemplateResponse } from '@/lib/api-types'

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  icon: z.string().optional(),
  category: z.string().optional(),
  fields: z.array(z.any()).optional(),
  folderId: z.string().uuid().optional().nullable(),
  // If editing a system template, provide worldId to create/update a world-specific override
  worldId: z.string().uuid().optional(),
})

export const PUT = withApiErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse<TemplateResponse>> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  
  if (authError || !user) {
    return apiAuthRequired()
  }

  const result = await parseRequestBody(req, updateTemplateSchema)
  if ('error' in result) {
    return result.error
  }

  const { unifiedService: worldService } = await import('@/lib/services')
  const template = await worldService.updateTemplate(params.id, result as any, user.id)
  
  // Map template to API response format
  const responseData = {
    id: template.id,
    name: template.name,
    description: template.description ?? undefined,
    fields: Array.isArray(template.fields) ? template.fields : [],
    isSystem: template.isSystem ?? false,
    worldId: template.worldId ?? undefined,
    createdAt: new Date().toISOString(), // TODO: Get from database
    updatedAt: new Date().toISOString(), // TODO: Get from database
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
  await worldService.deleteTemplate(params.id, user.id)
  
  return apiSuccess({ ok: true }, { 'X-Request-ID': requestId })
})

export const dynamic = 'force-dynamic'
