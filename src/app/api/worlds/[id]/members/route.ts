import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { z } from 'zod'
import {
  apiSuccess,
  apiAuthRequired,
  apiError,
  withApiErrorHandling,
  parseRequestBody,
  generateRequestId,
} from '@/lib/api-utils'
import { API_ERROR_CODES } from '@/lib/api-types'

export const dynamic = 'force-dynamic'

export const GET = withApiErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  if (authError || !user) {
    return apiAuthRequired()
  }

  const { unifiedService: worldService } = await import('@/lib/services')
  const members = await worldService.getWorldMembers(params.id, user.id)
  return NextResponse.json({ members }, { headers: { 'X-Request-ID': requestId } })
})

export const PUT = withApiErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  if (authError || !user) {
    return apiAuthRequired()
  }

  const schema = z.object({
    memberId: z.string().uuid(),
    role: z.enum(['owner', 'admin', 'editor', 'viewer']),
  })

  const bodyResult = await parseRequestBody(req, schema)
  if ('error' in bodyResult) {
    return bodyResult.error
  }
  const body = bodyResult

  const { unifiedService: worldService } = await import('@/lib/services')
  const member = await worldService.updateMemberRole(params.id, body.memberId, body.role, user.id)
  return NextResponse.json({ member }, { headers: { 'X-Request-ID': requestId } })
})

export const DELETE = withApiErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  if (authError || !user) {
    return apiAuthRequired()
  }

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('memberId')
  if (!memberId) {
    return NextResponse.json({ error: 'memberId query parameter required' }, { status: 400 })
  }

  const { unifiedService: worldService } = await import('@/lib/services')
  await worldService.removeMember(params.id, memberId, user.id)
  return NextResponse.json({ ok: true }, { headers: { 'X-Request-ID': requestId } })
})
