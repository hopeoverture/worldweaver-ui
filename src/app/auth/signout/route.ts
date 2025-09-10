import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  try {
    await supabase.auth.signOut()
  } catch {}

  const url = new URL(request.url)
  return NextResponse.redirect(new URL('/login', url.origin))
}

export const dynamic = 'force-dynamic'

