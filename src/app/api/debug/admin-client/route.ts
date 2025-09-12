import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Allow unauthenticated access to diagnostic endpoint
export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      adminClientExists: !!adminClient,
      environmentCheck: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
        nodeEnv: process.env.NODE_ENV,
      },
    }

    if (!adminClient) {
      results.error = 'Admin client not initialized'
      return NextResponse.json(results)
    }

    // Test basic admin client functionality
    try {
      const { data, error } = await adminClient
        .from('worlds')
        .select('id, name')
        .limit(1)

      results.adminClientTest = {
        success: !error,
        error: error?.message,
        foundWorlds: data?.length || 0,
      }
    } catch (testError) {
      results.adminClientTest = {
        success: false,
        error: testError instanceof Error ? testError.message : 'Unknown test error',
      }
    }

    // Test relationship table access
    try {
      const { data, error } = await adminClient
        .from('relationships')
        .select('id')
        .limit(1)

      results.relationshipTableTest = {
        success: !error,
        error: error?.message,
        foundRelationships: data?.length || 0,
      }
    } catch (testError) {
      results.relationshipTableTest = {
        success: false,
        error: testError instanceof Error ? testError.message : 'Unknown relationship test error',
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}