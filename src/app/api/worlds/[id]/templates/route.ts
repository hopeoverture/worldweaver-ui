import { NextRequest, NextResponse } from 'next/server'
import { getServerClientAndUser } from '@/lib/auth/server'
import { z } from 'zod'
import {
  withApiErrorHandling,
  apiAuthRequired,
  parseRequestBody,
  generateRequestId,
} from '@/lib/api-utils'

export const GET = withApiErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerClientAndUser()
  if (authError || !user) {
    return apiAuthRequired()
  }

  const { unifiedService: worldService } = await import('@/lib/services')
  const templates = await worldService.getWorldTemplates(params.id)
  return NextResponse.json({ templates }, { headers: { 'X-Request-ID': requestId } })
})

export const dynamic = 'force-dynamic'

export const POST = withApiErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { supabase, user, error: authError } = await getServerClientAndUser()
  if (authError || !user) {
    return apiAuthRequired()
  }

  const schema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    icon: z.string().optional(),
    category: z.string().optional(),
    fields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['shortText','longText','richText','number','select','multiSelect','image','reference']),
      required: z.boolean().optional(),
      options: z.array(z.string()).optional(),
      prompt: z.string().optional(),
      referenceType: z.string().optional(),
    })).default([]),
  })

  const bodyResult = await parseRequestBody(req, schema)
  if ('error' in bodyResult) {
    return bodyResult.error
  }
  const body = bodyResult

  const { unifiedService: worldService } = await import('@/lib/services')
  
  // Debug: check if user can access this world
  console.log('🎯 Template creation - checking world access for user:', user.id, 'world:', params.id)
  try {
    const world = await worldService.getWorldById(params.id, user.id)
    console.log('🎯 Template creation - world access check result:', !!world)
  } catch (error) {
    console.log('🎯 Template creation - world access failed:', error)
  }
  
  const template = await worldService.createTemplate(params.id, {
    name: body.name,
    description: body.description,
    icon: body.icon,
    category: body.category,
    fields: body.fields,
  }, user.id, supabase)
  return NextResponse.json({ template }, { headers: { 'X-Request-ID': requestId } })
})
