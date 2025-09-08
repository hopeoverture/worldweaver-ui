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
    const templates = await worldService.getWorldTemplates(params.id)
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
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
      icon: z.string().optional(),
      category: z.string().optional(),
      fields: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['shortText','longText','richText','number','select','multiSelect','image','reference']),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
        prompt: z.string().optional(),
        referenceType: z.string().optional(),
      })).default([]),
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
    const template = await worldService.createTemplate(params.id, {
      name: body.name,
      description: body.description,
      icon: body.icon,
      category: body.category,
      fields: body.fields,
    })
    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
