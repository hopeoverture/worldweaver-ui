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
    const entity = await worldService.getEntityById(params.id, user.id)
    if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ entity })
  } catch (error) {
    console.error('Error fetching entity:', error)
    return NextResponse.json({ error: 'Failed to fetch entity' }, { status: 500 })
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
      templateId: z.string().uuid().nullable().optional(),
      folderId: z.string().uuid().nullable().optional().or(z.literal('')),
      fields: z.record(z.unknown()).optional(),
      tags: z.array(z.string()).nullable().optional(),
    })

    let body: z.infer<typeof schema>
    try {
      const json = await req.json()
      body = schema.parse(json)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', issues: e.issues }, { status: 400 })
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { worldService } = await import('@/lib/services/worldService')
    const updated = await worldService.updateEntity(
      params.id,
      {
        name: body.name,
        templateId: body.templateId ?? undefined,
        folderId: body.folderId === '' ? undefined : (body.folderId ?? undefined),
        fields: body.fields,
        tags: body.tags ?? undefined,
      },
      user.id,
    )
    return NextResponse.json({ entity: updated })
  } catch (error) {
    console.error('Error updating entity:', error)
    return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 })
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
    await worldService.deleteEntity(params.id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting entity:', error)
    return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

