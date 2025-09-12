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
  const requestId = generateRequestId()
  const debugSteps: string[] = ['HANDLER_START']
  
  console.log('🔥 Template handler starting', { requestId, timestamp: new Date().toISOString() })
  
  try {
    debugSteps.push('EXTRACT_PARAMS')
    const params = await ctx.params
    
    debugSteps.push('GET_AUTH')
    const { supabase, user, error: authError } = await getServerClientAndUser()
    
    if (authError || !user) {
      debugSteps.push('AUTH_FAILED')
      return apiAuthRequired()
    }
    debugSteps.push('AUTH_SUCCESS')

    debugSteps.push('DEFINE_SCHEMA')
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

    debugSteps.push('PARSE_BODY')
    const bodyResult = await parseRequestBody(req, schema)
    
    if ('error' in bodyResult) {
      debugSteps.push('BODY_PARSE_FAILED')
      return bodyResult.error
    }
    const body = bodyResult
    debugSteps.push('BODY_PARSE_SUCCESS')

    debugSteps.push('IMPORT_SERVICES')
    const { unifiedService: worldService } = await import('@/lib/services')
    debugSteps.push('SERVICES_IMPORTED')
    
    debugSteps.push('CREATE_TEMPLATE')
    
    // DEBUG: Check if supabase client has proper auth context
    const { data: clientAuthUser } = await supabase.auth.getUser()
    debugSteps.push(`CLIENT_AUTH_CHECK:${clientAuthUser?.id || 'NULL'}`)
    
    const template = await worldService.createTemplate(params.id, {
      name: body.name,
      description: body.description,
      icon: body.icon,
      category: body.category,
      fields: body.fields,
    }, user.id, supabase)
    
    debugSteps.push('TEMPLATE_CREATED')
    return NextResponse.json({ template }, { 
      headers: { 
        'X-Request-ID': requestId,
        'X-Debug-Steps': debugSteps.join(',')
      } 
    })
  } catch (error) {
    debugSteps.push('HANDLER_EXCEPTION')
    debugSteps.push(error instanceof Error ? error.message : String(error))
    throw error  // Re-throw to be caught by outer handler
  }
}

// Temporary: bypass error wrapper to test execution flow
export const POST = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const debugInfo: string[] = ['POST_START']
  
  console.log('🚀 POST handler starting', { timestamp: new Date().toISOString() })
  
  try {
    debugInfo.push('CALLING_HANDLER')
    console.log('🚀 About to call templatePostHandler')
    const result = await templatePostHandler(req, ctx)
    console.log('🚀 templatePostHandler returned successfully')
    debugInfo.push('HANDLER_SUCCESS')
    
    // Add debug headers to successful response
    result.headers.set('X-Debug-Flow', debugInfo.join(','))
    return result
  } catch (error) {
    console.log('🚀 POST handler caught error', { error, errorMessage: error instanceof Error ? error.message : String(error) })
    debugInfo.push('HANDLER_ERROR')
    debugInfo.push(`ERROR:${error instanceof Error ? error.message : String(error)}`)
    
    return NextResponse.json({ 
      error: 'Template creation failed',
      debug: debugInfo,
      errorDetails: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack
      } : String(error)
    }, { 
      status: 500,
      headers: {
        'X-Debug-Flow': debugInfo.join(','),
        'X-Error-Type': error instanceof Error ? error.constructor.name : 'Unknown'
      }
    })
  }
}

// export const POST = withApiErrorHandling(templatePostHandler)
