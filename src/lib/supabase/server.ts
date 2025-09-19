import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types.generated'

export const createClient = async () => {
  const cookieStore = await cookies()

  // Check if we have valid Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    throw new Error('Supabase credentials not configured')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // Extend session duration and enable auto-refresh
        persistSession: true,
        autoRefreshToken: true,
        // Detect session from URL for OAuth flows
        detectSessionInUrl: true,
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
