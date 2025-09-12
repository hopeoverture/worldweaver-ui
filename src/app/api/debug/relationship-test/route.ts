import { NextResponse, NextRequest } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Replicate the exact same flow as the main relationship endpoint
    console.log('🧪 DEBUG: Starting relationship test')
    
    // Step 1: Authentication (same as main endpoint)
    const { user: authUser, error: authError } = await getServerAuth()
    if (authError || !authUser) {
      return NextResponse.json({
        success: false,
        step: 'authentication',
        error: 'Authentication failed',
        details: authError?.message || 'No user'
      })
    }

    console.log('🧪 DEBUG: Auth passed', { userId: authUser.id })

    // Step 2: Parse request body (same as main endpoint)
    const body = await req.json()
    const { worldId, fromEntityId, toEntityId, label } = body

    console.log('🧪 DEBUG: Request parsed', { worldId, fromEntityId, toEntityId, label })

    // Step 3: Call the exact same worldService method that's failing
    try {
      const { supabaseWorldService } = await import('@/lib/services/supabaseWorldService')
      console.log('🧪 DEBUG: About to call supabaseWorldService.createRelationship')
      
      const relationship = await supabaseWorldService.createRelationship(
        worldId,
        {
          fromEntityId,
          toEntityId,
          label,
          description: null,
          metadata: null,
        },
        authUser.id,
      )

      console.log('🧪 DEBUG: worldService.createRelationship succeeded', { relationshipId: relationship.id })

      return NextResponse.json({
        success: true,
        step: 'completed',
        relationship,
        message: 'Relationship created successfully via debug endpoint'
      })

    } catch (serviceError) {
      console.log('🧪 DEBUG: worldService.createRelationship failed', { 
        error: serviceError,
        message: serviceError instanceof Error ? serviceError.message : 'Unknown error',
        stack: serviceError instanceof Error ? serviceError.stack : undefined
      })

      return NextResponse.json({
        success: false,
        step: 'worldService.createRelationship',
        error: serviceError instanceof Error ? serviceError.message : 'Unknown service error',
        details: serviceError instanceof Error ? serviceError.stack : undefined,
        originalError: serviceError
      })
    }

  } catch (error) {
    console.log('🧪 DEBUG: Outer catch', { error })
    return NextResponse.json({
      success: false,
      step: 'outer_catch',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    })
  }
}