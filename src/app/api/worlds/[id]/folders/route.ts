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
    const folders = await worldService.getWorldFolders(params.id, user.id)
    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
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
      description: z.string().max(5000).optional(),
      color: z.string().max(32).optional(),
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
    const folder = await worldService.createFolder(params.id, {
      name: body.name,
      description: body.description,
      color: body.color,
    }, user.id)

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
