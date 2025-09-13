import { NextRequest, NextResponse } from 'next/server'
import { getServerClientAndUser } from '@/lib/auth/server'
import { z } from 'zod'
import {
  apiSuccess,
  apiAuthRequired,
  parseRequestBody,
  withApiErrorHandling,
  generateRequestId
} from '@/lib/api-utils'
import { ActivityLogger } from '@/lib/activity-logger'

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  social_links: z.record(z.string()).optional(),
  banner_url: z.string().url().optional().or(z.literal('')),
  data: z.any().optional()
})

export const PUT = withApiErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const requestId = generateRequestId()

  // Get authenticated user
  const { supabase, user, error: authError } = await getServerClientAndUser()

  if (authError || !user) {
    return apiAuthRequired()
  }

  // Parse and validate request body
  const bodyResult = await parseRequestBody(request, updateProfileSchema)
  if ('error' in bodyResult) {
    return bodyResult.error
  }

  const updates = bodyResult

  // Update profile in database
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  // Log profile update activity
  try {
    const updatedFields = Object.keys(updates).filter(key =>
      updates[key as keyof typeof updates] !== undefined &&
      updates[key as keyof typeof updates] !== null &&
      updates[key as keyof typeof updates] !== ''
    )
    if (updatedFields.length > 0) {
      await ActivityLogger.profileUpdated(user.id, updatedFields)
    }
  } catch (error) {
    // Silent failure for activity logging
    console.warn('Failed to log profile update activity:', error)
  }

  return apiSuccess(updatedProfile, { 'X-Request-ID': requestId })
})

export const dynamic = 'force-dynamic'