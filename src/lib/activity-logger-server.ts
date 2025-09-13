import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import type { TablesInsert } from '@/lib/supabase/types'

export interface ActivityLogParams {
  userId: string
  action: string
  description: string
  resourceType?: string
  resourceId?: string
  resourceName?: string
  worldId?: string
  metadata?: Record<string, any>
}

/**
 * Server-only activity logging function
 * Uses admin client to bypass RLS policies
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    if (!adminClient) {
      console.warn('Admin client not available for activity logging')
      return
    }

    const supabase = adminClient

    const activityData: TablesInsert<'activity_logs'> = {
      user_id: params.userId,
      action: params.action,
      description: params.description,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      resource_name: params.resourceName || null,
      world_id: params.worldId || null,
      metadata: params.metadata || {}
    }

    const { error } = await supabase
      .from('activity_logs')
      .insert(activityData)

    if (error) {
      console.error('Failed to log activity:', error)
      // Don't throw - activity logging should not break main functionality
    }
  } catch (error) {
    console.error('Activity logging error:', error)
    // Silent failure for activity logging
  }
}