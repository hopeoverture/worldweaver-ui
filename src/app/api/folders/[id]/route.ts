import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { z } from 'zod'
import {
  withApiErrorHandling,
  apiAuthRequired,
  parseRequestBody,
  generateRequestId,
} from '@/lib/api-utils'

export const GET = withApiErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  if (authError || !user) {
    return apiAuthRequired()
  }

  const { folderService } = await import('@/lib/services/folderService')
  const folder = await folderService.getFolderById(params.id, user.id)
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'X-Request-ID': requestId } })
  return NextResponse.json({ folder }, { headers: { 'X-Request-ID': requestId } })
})

export const PUT = withApiErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  if (authError || !user) {
    return apiAuthRequired()
  }

  const schema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    color: z.string().max(32).nullable().optional(),
  })

  const bodyResult = await parseRequestBody(req, schema)
  if ('error' in bodyResult) {
    return bodyResult.error
  }
  const body = bodyResult

  const { folderService } = await import('@/lib/services/folderService')
  const updated = await folderService.updateFolder(params.id, {
    name: body.name,
    description: body.description,
    color: body.color ?? undefined,
  }, user.id)
  return NextResponse.json({ folder: updated }, { headers: { 'X-Request-ID': requestId } })
})

export const DELETE = withApiErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  if (authError || !user) {
    return apiAuthRequired()
  }

  const { folderService } = await import('@/lib/services/folderService')
  await folderService.deleteFolder(params.id, user.id)
  return NextResponse.json({ ok: true }, { headers: { 'X-Request-ID': requestId } })
})

export const dynamic = 'force-dynamic'
