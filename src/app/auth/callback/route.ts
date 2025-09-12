import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles Supabase OAuth callback by exchanging the `code` for a session
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (e) {
      // Fall through to redirect
    }
  }

  // Redirect home or to the provided `redirect_to` param if present
  const redirectTo = url.searchParams.get('redirect_to') || '/'
  return NextResponse.redirect(new URL(redirectTo, url.origin))
}

export const dynamic = 'force-dynamic'

