import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import {
  apiAuthRequired,
  withApiErrorHandling,
  generateRequestId,
} from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

// Get information about a world for joining via invite link
export const GET = withApiErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  
  if (authError || !user) {
    return apiAuthRequired()
  }

  const { unifiedService: worldService } = await import('@/lib/services')
  
  try {
    // Get world info - this will check if world exists and if user has access
    const world = await worldService.getWorldById(params.id, user.id)
    
    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 })
    }

    // Check if user is already a member
    const members = await worldService.getWorldMembers(params.id, user.id)
    const alreadyMember = members.some(member => member.userId === user.id) || world.ownerId === user.id

    // Get owner info
    const ownerInfo = await worldService.getUserProfile(world.ownerId)

    const response = {
      world: {
        id: world.id,
        name: world.name,
        description: world.description,
        inviteLinkEnabled: world.inviteLinkEnabled || false,
        memberCount: members.length + 1, // +1 for owner
        seatLimit: world.seatLimit,
        owner: {
          name: ownerInfo?.fullName || ownerInfo?.email || 'Unknown',
          email: ownerInfo?.email || '',
        }
      },
      alreadyMember
    }

    return NextResponse.json(response, { headers: { 'X-Request-ID': requestId } })
  } catch (error) {
    console.error('Error fetching world join info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch world information' }, 
      { status: 500, headers: { 'X-Request-ID': requestId } }
    )
  }
})