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

const templatePostHandler = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  console.log('🚀 Template API - POST request started - DIRECT LOG')
  console.error('🚀 Template API - POST request started - ERROR LOG')  // Try console.error too
  const requestId = generateRequestId()
  console.log('🚀 Template API - request ID generated:', requestId)
  
  const params = await ctx.params
  console.log('🚀 Template API - params extracted:', params)
  
  console.log('🚀 Template API - calling getServerClientAndUser')
  const { supabase, user, error: authError } = await getServerClientAndUser()
  console.log('🚀 Template API - auth result:', { user: user?.id, hasSupabase: !!supabase, authError })
  
  if (authError || !user) {
    console.log('🚀 Template API - auth failed, returning apiAuthRequired')
    return apiAuthRequired()
  }

  console.log('🚀 Template API - defining schema')
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

  console.log('🚀 Template API - parsing request body')
  const bodyResult = await parseRequestBody(req, schema)
  console.log('🚀 Template API - body parse result:', { success: !('error' in bodyResult), bodyKeys: 'error' in bodyResult ? 'error' : Object.keys(bodyResult) })
  
  if ('error' in bodyResult) {
    console.log('🚀 Template API - body parsing failed, returning error')
    return bodyResult.error
  }
  const body = bodyResult
  console.log('🚀 Template API - body parsed successfully:', { name: body.name, fieldsCount: body.fields?.length || 0 })

  console.log('🚀 Template API - importing services')
  const { unifiedService: worldService } = await import('@/lib/services')
  console.log('🚀 Template API - services imported successfully')
  
  // Debug: check if user can access this world
  console.log('🚀 Template API - checking world access for user:', user.id, 'world:', params.id)
  try {
    const world = await worldService.getWorldById(params.id, user.id)
    console.log('🚀 Template API - world access check result:', !!world)
  } catch (error) {
    console.log('🚀 Template API - world access failed:', error)
  }
  
  console.log('🚀 Template API - calling createTemplate service')
  const template = await worldService.createTemplate(params.id, {
    name: body.name,
    description: body.description,
    icon: body.icon,
    category: body.category,
    fields: body.fields,
  }, user.id, supabase)
  
  console.log('🚀 Template API - createTemplate completed successfully:', { templateId: template?.id })
  return NextResponse.json({ template }, { headers: { 'X-Request-ID': requestId } })
}

// Temporary: bypass error wrapper to test if logs appear
export const POST = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  console.log('🚀🚀🚀 DIRECT POST - NO WRAPPER - START')
  console.error('🚀🚀🚀 DIRECT POST - NO WRAPPER - ERROR LOG')
  
  try {
    return await templatePostHandler(req, ctx)
  } catch (error) {
    console.log('🚀🚀🚀 DIRECT POST - CAUGHT ERROR:', error)
    console.error('🚀🚀🚀 DIRECT POST - CAUGHT ERROR (ERROR LOG):', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// export const POST = withApiErrorHandling(templatePostHandler)
