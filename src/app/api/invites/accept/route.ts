import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const token = String(body?.token || '')
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('accept_world_invite', { invite_token: token })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ ok: false, accepted: false }, { status: 400 })
    }

    return NextResponse.json({ ok: true, accepted: true })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error', detail: String((err as Error)?.message || err) }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
