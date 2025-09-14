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
  const folders = await folderService.getWorldFolders(params.id, user.id)
  return NextResponse.json({ folders }, { headers: { 'X-Request-ID': requestId } })
})

export const dynamic = 'force-dynamic'

export const POST = withApiErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const requestId = generateRequestId()
  const params = await ctx.params
  const { user, error: authError } = await getServerAuth()
  if (authError || !user) {
    return apiAuthRequired()
  }

  const schema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    color: z.string().max(32).optional(),
    kind: z.enum(['entities', 'templates']).optional().default('entities'),
    parentFolderId: z.string().uuid().optional(),
  })

  const bodyResult = await parseRequestBody(req, schema)
  if ('error' in bodyResult) {
    return bodyResult.error
  }
  const body = bodyResult

  const { folderService } = await import('@/lib/services/folderService')
  const folder = await folderService.createFolder(params.id, {
    name: body.name,
    description: body.description,
    color: body.color,
    kind: body.kind,
    parentFolderId: body.parentFolderId,
  }, user.id)

  return NextResponse.json({ folder }, { headers: { 'X-Request-ID': requestId } })
})
