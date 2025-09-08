import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'node:crypto'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const worldId = params.id
    const body = await req.json().catch(() => ({}))
    const email: string = String(body?.email || '').trim()
    const role: 'admin' | 'editor' | 'viewer' = body?.role || 'viewer'
    const days: number = Number(body?.expiresInDays ?? 7)
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    // RLS ensures only owner/admin can insert
    const { data, error } = await supabase
      .from('world_invites')
      .insert({
        world_id: worldId,
        email,
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Return a link-friendly token so the client can email it
    return NextResponse.json({ ok: true, invite: data })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error', detail: String((err as Error)?.message || err) }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch invites for this world. RLS ensures:
    // - Owners/admins see all invites for the world
    // - An invited user only sees their own invite (email match)
    const { data, error } = await supabase
      .from('world_invites')
      .select('*')
      .eq('world_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ invites: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error', detail: String((err as Error)?.message || err) }, { status: 500 })
  }
}
