import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Revoke an invite (owner/admin per RLS). Deletes by invite id and world id.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; inviteId: string }> }) {
  try {
    const params = await ctx.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { error } = await supabase
      .from('world_invites')
      .delete()
      .eq('id', params.inviteId)
      .eq('world_id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error', detail: String((err as Error)?.message || err) }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
