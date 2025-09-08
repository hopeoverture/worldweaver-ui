import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const { user, error: authError } = await getServerAuth()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const schema = z.object({
      label: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).nullable().optional(),
      metadata: z.record(z.unknown()).nullable().optional(),
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
    const rel = await worldService.updateRelationship(
      params.id,
      {
        label: body.label,
        description: body.description ?? undefined,
        metadata: body.metadata ?? undefined,
      },
      user.id,
    )
    return NextResponse.json({ relationship: rel })
  } catch (error) {
    console.error('Error updating relationship:', error)
    return NextResponse.json({ error: 'Failed to update relationship' }, { status: 500 })
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
    await worldService.deleteRelationship(params.id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting relationship:', error)
    return NextResponse.json({ error: 'Failed to delete relationship' }, { status: 500 })
  }
}

