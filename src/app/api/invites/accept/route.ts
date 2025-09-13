import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { ActivityLogger } from '@/lib/activity-logger'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const schema = z.object({ token: z.string().min(1) })
    let body: z.infer<typeof schema>
    try {
      body = schema.parse(await req.json())
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', issues: e.issues }, { status: 400 })
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('accept_world_invite' as any, { invite_token: body.token })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ ok: false, accepted: false }, { status: 400 })
    }

    // Log invite acceptance activity
    try {
      // Get the invite details to find the world
      const { data: invite } = await supabase
        .from('world_invites')
        .select('world_id, worlds(name)')
        .eq('token', body.token)
        .single()

      if (invite && invite.world_id) {
        const { logActivity } = await import('@/lib/activity-logger')
        await logActivity({
          userId: user.id,
          action: 'accept_invite',
          description: `Accepted invite to join "${(invite.worlds as any)?.name || 'Unknown World'}"`,
          resourceType: 'invite',
          worldId: invite.world_id,
          resourceName: (invite.worlds as any)?.name
        })
      }
    } catch (error) {
      // Silent failure for activity logging
      console.warn('Failed to log invite acceptance activity:', error)
    }

    return NextResponse.json({ ok: true, accepted: true })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error', detail: String((err as Error)?.message || err) }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
