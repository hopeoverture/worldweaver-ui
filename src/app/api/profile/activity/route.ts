import { NextRequest, NextResponse } from 'next/server'
import { getServerClientAndUser } from '@/lib/auth/server'
import {
  apiSuccess,
  apiAuthRequired,
  apiInternalError,
  withApiErrorHandling,
  generateRequestId
} from '@/lib/api-utils'
import type { ActivityLog } from '@/lib/supabase/types'

export interface ActivityResponse {
  activities: ActivityLog[]
  total: number
}

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const requestId = generateRequestId()

  // Get authenticated user
  const { supabase, user, error: authError } = await getServerClientAndUser()

  if (authError || !user) {
    return apiAuthRequired()
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user activities with pagination
    const { data: activities, error: activitiesError, count } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (activitiesError) throw activitiesError

    const response: ActivityResponse = {
      activities: activities || [],
      total: count || 0
    }

    return apiSuccess(response, { 'X-Request-ID': requestId })
  } catch (error) {
    console.error('Error fetching user activities:', error)
    return apiInternalError()
  }
})

export const dynamic = 'force-dynamic'