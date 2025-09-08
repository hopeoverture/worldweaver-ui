import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { z } from 'zod'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const { user, error: authError } = await getServerAuth()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { worldService } = await import('@/lib/services/worldService')
    // We don't have a direct worldService method, but we can fetch via supabase service
    const svc = (await import('@/lib/services/supabaseWorldService')).supabaseWorldService
    const folder = await svc.getFolderById(params.id, user.id)
    if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Error fetching folder:', error)
    return NextResponse.json({ error: 'Failed to fetch folder' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const { user, error: authError } = await getServerAuth()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const schema = z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional(),
      color: z.string().max(32).nullable().optional(),
    })

    let body: z.infer<typeof schema>
    try {
      body = schema.parse(await req.json())
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', issues: e.issues }, { status: 400 })
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { worldService } = await import('@/lib/services/worldService')
    const updated = await worldService.updateFolder(params.id, {
      name: body.name,
      description: body.description,
      color: body.color ?? undefined,
    }, user.id)
    return NextResponse.json({ folder: updated })
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const { user, error: authError } = await getServerAuth()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { worldService } = await import('@/lib/services/worldService')
    await worldService.deleteFolder(params.id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

