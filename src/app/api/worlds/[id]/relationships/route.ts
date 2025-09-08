import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const { user, error: authError } = await getServerAuth()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { worldService } = await import('@/lib/services/worldService')
    const relationships = await worldService.getWorldRelationships(params.id, user.id)
    return NextResponse.json({ relationships })
  } catch (error) {
    console.error('Error fetching relationships:', error)
    return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const { user, error: authError } = await getServerAuth()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const schema = z.object({
      fromEntityId: z.string().uuid(),
      toEntityId: z.string().uuid(),
      label: z.string().min(1).max(200),
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
    const rel = await worldService.createRelationship(
      params.id,
      {
        fromEntityId: body.fromEntityId,
        toEntityId: body.toEntityId,
        label: body.label,
        description: body.description ?? null,
        metadata: body.metadata ?? null,
      },
      user.id,
    )

    return NextResponse.json({ relationship: rel })
  } catch (error) {
    console.error('Error creating relationship:', error)
    return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 })
  }
}

