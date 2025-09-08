import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { z } from 'zod'

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
      icon: z.string().optional(),
      category: z.string().optional(),
      fields: z.array(z.any()).optional(),
      // If editing a system template, provide worldId to create/update a world-specific override
      worldId: z.string().uuid().optional(),
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
    const template = await worldService.updateTemplate(params.id, body as any, user.id)
    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
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
    await worldService.deleteTemplate(params.id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
