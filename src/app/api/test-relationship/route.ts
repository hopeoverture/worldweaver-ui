import { NextResponse, NextRequest } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 TEST ROUTE: Starting relationship creation test')
    
    // Environment diagnostics
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      adminClientExists: !!adminClient,
      nodeEnv: process.env.NODE_ENV,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
    }
    
    console.log('🔧 TEST ROUTE: Environment check', envCheck)

    if (!adminClient) {
      console.log('❌ TEST ROUTE: Admin client not available')
      return NextResponse.json({
        success: false,
        error: 'Admin client not initialized',
        diagnostics: envCheck,
      })
    }

    // Get request data
    const body = await req.json()
    console.log('📥 TEST ROUTE: Request body', body)
    
    const { worldId, fromEntityId, toEntityId, label } = body

    // Test admin client with a simple query first
    console.log('🔍 TEST ROUTE: Testing admin client with worlds query')
    const { data: worldTest, error: worldError } = await adminClient
      .from('worlds')
      .select('id, name')
      .eq('id', worldId)
      .limit(1)

    if (worldError) {
      console.log('❌ TEST ROUTE: Admin client world query failed', worldError)
      return NextResponse.json({
        success: false,
        error: 'Admin client world access failed',
        details: worldError.message,
        diagnostics: envCheck,
      })
    }

    console.log('✅ TEST ROUTE: World query successful', { worldFound: !!worldTest?.length })

    // Test entities query
    console.log('🔍 TEST ROUTE: Testing entities query')
    const { data: entities, error: entitiesError } = await adminClient
      .from('entities')
      .select('id, name')
      .eq('world_id', worldId)
      .in('id', [fromEntityId, toEntityId])

    if (entitiesError) {
      console.log('❌ TEST ROUTE: Entities query failed', entitiesError)
      return NextResponse.json({
        success: false,
        error: 'Entities query failed',
        details: entitiesError.message,
        diagnostics: envCheck,
      })
    }

    console.log('✅ TEST ROUTE: Entities query successful', { 
      entitiesFound: entities?.length || 0,
      entities: entities?.map(e => ({ id: e.id, name: e.name }))
    })

    if (!entities || entities.length !== 2) {
      return NextResponse.json({
        success: false,
        error: 'Required entities not found',
        details: `Found ${entities?.length || 0} entities, expected 2`,
        diagnostics: envCheck,
      })
    }

    // Test relationship insert
    console.log('💾 TEST ROUTE: Testing relationship insert')
    const insertData = {
      world_id: worldId,
      from_entity_id: fromEntityId,
      to_entity_id: toEntityId,
      relationship_type: label,
      description: null,
      metadata: {},
    }

    console.log('💾 TEST ROUTE: Insert data', insertData)

    const { data: relationship, error: insertError } = await adminClient
      .from('relationships')
      .insert(insertData)
      .select('*')
      .single()

    if (insertError) {
      console.log('❌ TEST ROUTE: Relationship insert failed', {
        error: insertError,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        message: insertError.message
      })
      return NextResponse.json({
        success: false,
        error: 'Relationship insert failed',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        diagnostics: envCheck,
      })
    }

    console.log('✅ TEST ROUTE: Relationship created successfully', { id: relationship?.id })

    return NextResponse.json({
      success: true,
      relationship: relationship,
      diagnostics: envCheck,
    })

  } catch (error) {
    console.log('💥 TEST ROUTE: Unexpected error', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}