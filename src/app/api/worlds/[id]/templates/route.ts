import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
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
  const { user, error: authError } = await getServerAuth()
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
  const { user, error: authError } = await getServerAuth()
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
  const template = await worldService.createTemplate(params.id, {
    name: body.name,
    description: body.description,
    icon: body.icon,
    category: body.category,
    fields: body.fields,
  })
  return NextResponse.json({ template }, { headers: { 'X-Request-ID': requestId } })
})
