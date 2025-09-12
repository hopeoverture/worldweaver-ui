import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { safeConsoleError } from '@/lib/logging'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

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
    const relationships = await worldService.getWorldRelationships(params.id, user.id)
    return NextResponse.json({ relationships })
  } catch (error) {
    safeConsoleError('Error fetching relationships', error as Error, { action: 'GET_relationships', worldId: params?.id, userId: user?.id })
    return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let params: { id: string } | undefined
  let user: any
  let requestBody: any = {}
  
  try {
    params = await ctx.params
    const worldId = params.id
    
    // Check for debug flag
    const url = new URL(req.url)
    const debug = url.searchParams.get('debug') === 'true'
    
    safeConsoleError('🚀 Relationships POST start - CACHE BUST v3', new Error('DEBUG'), { 
      worldId, 
      action: 'POST_relationships_start',
      timestamp: new Date().toISOString()
    })

    const { user: authUser, error: authError } = await getServerAuth()
    user = authUser
    if (authError || !user) {
      safeConsoleError('❌ Authentication failed', authError || new Error('No user'), { 
        worldId, 
        action: 'POST_relationships_auth_fail',
        metadata: {
          authErrorMessage: authError?.message
        }
      })
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Parse request body first for better error reporting
    try {
      requestBody = await req.json()
      safeConsoleError('📥 Request body received', new Error('DEBUG'), { 
        worldId, 
        userId: user.id,
        action: 'POST_relationships_body_parsed',
        metadata: {
          requestBody
        }
      })
    } catch (e) {
      safeConsoleError('❌ Failed to parse request body', e as Error, { 
        worldId, 
        userId: user.id,
        action: 'POST_relationships_json_parse_fail' 
      })
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const schema = z.object({
      fromEntityId: z.string().uuid('From entity ID must be a valid UUID'),
      toEntityId: z.string().uuid('To entity ID must be a valid UUID'),
      label: z.string().min(1, 'Relationship type is required').max(200, 'Relationship type too long'),
      description: z.string().max(1000, 'Description too long').nullable().optional(),
      metadata: z.record(z.unknown()).nullable().optional(),
    })

    let body: z.infer<typeof schema>
    try {
      body = schema.parse(requestBody)
      safeConsoleError('✅ Request body validated', new Error('DEBUG'), { 
        worldId, 
        userId: user.id,
        action: 'POST_relationships_validation_success',
        metadata: {
          validatedBody: body
        }
      })
    } catch (e) {
      if (e instanceof z.ZodError) {
        const errorDetails = e.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
        safeConsoleError('❌ Request validation failed', e, { 
          worldId, 
          userId: user.id,
          action: 'POST_relationships_validation_fail',
          metadata: {
            requestBody,
            validationErrors: errorDetails
          }
        })
        return NextResponse.json({ 
          error: 'Invalid request body', 
          details: errorDetails 
        }, { status: 400 })
      }
      safeConsoleError('❌ Unexpected validation error', e as Error, { 
        worldId, 
        userId: user.id,
        action: 'POST_relationships_validation_error',
        metadata: {
          requestBody
        }
      })
      return NextResponse.json({ error: 'Request validation failed' }, { status: 400 })
    }

    // Additional validation: ensure entities are different
    if (body.fromEntityId === body.toEntityId) {
      safeConsoleError('❌ Same entity relationship attempted', new Error('Same entity relationship'), { 
        worldId, 
        userId: user.id,
        entityId: body.fromEntityId,
        action: 'POST_relationships_same_entity' 
      })
      return NextResponse.json({ 
        error: 'Cannot create relationship between the same entity' 
      }, { status: 400 })
    }

    const { worldService } = await import('@/lib/services/worldService')
    
    safeConsoleError('🔄 Creating relationship via worldService', new Error('DEBUG'), { 
      worldId, 
      userId: user.id,
      action: 'POST_relationships_service_call',
      metadata: {
        relationshipData: body
      }
    })
    
    let rel
    try {
      rel = await worldService.createRelationship(
        worldId,
        {
          fromEntityId: body.fromEntityId,
          toEntityId: body.toEntityId,
          label: body.label,
          description: body.description ?? null,
          metadata: body.metadata ?? null,
        },
        user.id,
      )
    } catch (serviceError) {
      safeConsoleError('💥 WorldService.createRelationship failed', serviceError as Error, { 
        worldId, 
        userId: user.id,
        fromEntityId: body.fromEntityId,
        toEntityId: body.toEntityId,
        action: 'POST_relationships_service_error',
        metadata: {
          serviceErrorMessage: serviceError instanceof Error ? serviceError.message : 'Unknown service error',
          serviceErrorStack: serviceError instanceof Error ? serviceError.stack : undefined,
          relationshipData: body
        }
      })
      
      // Re-throw with more context
      if (serviceError instanceof Error) {
        throw new Error(`Service layer error: ${serviceError.message}`)
      }
      throw new Error('Unknown service layer error')
    }

    safeConsoleError('✅ Relationship created successfully', new Error('DEBUG'), { 
      worldId, 
      userId: user.id,
      relationshipId: rel.id,
      action: 'POST_relationships_success' 
    })

    return NextResponse.json({ relationship: rel })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    safeConsoleError('💥 Error creating relationship', error as Error, { 
      worldId: params?.id, 
      userId: user?.id,
      action: 'POST_relationships_error',
      metadata: {
        requestBody,
        errorMessage,
        errorStack
      }
    })
    
    // Provide more specific error messages based on common issues
    if (errorMessage.includes('World not found')) {
      return NextResponse.json({ error: 'World not found or access denied' }, { status: 404 })
    }
    if (errorMessage.includes('Database error')) {
      return NextResponse.json({ error: 'Database operation failed', details: errorMessage }, { status: 500 })
    }
    if (errorMessage.includes('Entity not found') || errorMessage.includes('foreign key')) {
      return NextResponse.json({ error: 'One or both entities not found in this world' }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to create relationship',
      details: errorMessage 
    }, { status: 500 })
  }
}

