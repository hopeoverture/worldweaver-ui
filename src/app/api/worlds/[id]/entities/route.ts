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
    const entities = await worldService.getWorldEntities(params.id, user.id)
    return NextResponse.json({ entities })
  } catch (error) {
    console.error('Error fetching entities:', error)
    return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const { user, error: authError } = await getServerAuth()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const schema = z.object({
      name: z.string().min(1).max(200),
      templateId: z.string().uuid().optional(),
      folderId: z.string().uuid().optional().or(z.literal('')),
      fields: z.record(z.unknown()).default({}),
      tags: z.array(z.string()).optional(),
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
    const entity = await worldService.createEntity(params.id, {
      name: body.name,
      templateId: body.templateId,
      folderId: body.folderId || undefined,
      fields: body.fields,
      tags: body.tags,
    }, user.id)

    return NextResponse.json({ entity })
  } catch (error) {
    console.error('Error creating entity:', error)
    return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 })
  }
}
