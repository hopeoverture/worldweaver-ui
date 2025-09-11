import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'
import { requireEnv } from '@/lib/env'

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // cookieStore.set may throw when called from a Server Component; ignore safely
            cookieStore.set({ name, value, ...options })
          } catch {
            // ignore in server component context
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // ignore in server component context
          }
        },
      },
    }
  )
}
