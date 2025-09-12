import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import {
  apiAuthRequired,
  withApiErrorHandling,
  generateRequestId,
} from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

// Join a world via invite link
export const POST = withApiErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  
  if (authError || !user) {
    return apiAuthRequired()
  }

  const { unifiedService: worldService } = await import('@/lib/services')
  
  try {
    // First, get world info to validate
    const world = await worldService.getWorldById(params.id, user.id)
    
    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 })
    }

    // Check if invite links are enabled
    if (!world.inviteLinkEnabled) {
      return NextResponse.json({ error: 'Invite links are not enabled for this world' }, { status: 403 })
    }

    // Check if user is already the owner
    if (world.ownerId === user.id) {
      return NextResponse.json({ error: 'You are already the owner of this world' }, { status: 400 })
    }

    // Check if user is already a member
    const members = await worldService.getWorldMembers(params.id, user.id)
    const alreadyMember = members.some(member => member.userId === user.id)
    
    if (alreadyMember) {
      return NextResponse.json({ error: 'You are already a member of this world' }, { status: 400 })
    }

    // Check seat limit if it exists
    if (world.seatLimit && members.length >= world.seatLimit - 1) { // -1 because owner takes a seat
      return NextResponse.json({ error: 'This world has reached its member limit' }, { status: 403 })
    }

    // Add user as a member with viewer role by default
    const newMember = await worldService.addMemberByJoin(params.id, user.id, 'viewer')

    return NextResponse.json({ 
      member: newMember,
      message: 'Successfully joined the world!' 
    }, { 
      status: 201,
      headers: { 'X-Request-ID': requestId } 
    })
  } catch (error) {
    console.error('Error joining world:', error)
    return NextResponse.json(
      { error: 'Failed to join world' }, 
      { status: 500, headers: { 'X-Request-ID': requestId } }
    )
  }
})