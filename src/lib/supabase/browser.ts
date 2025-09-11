import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types.generated'

export function createClient() {
  // Only create client in browser environment
  if (typeof window === 'undefined') {
    throw new Error('Browser client can only be created in browser environment')
  }

  // Check if we have valid Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}

// For backward compatibility, create a singleton instance (only when valid)
// Use lazy initialization to avoid errors during build
let supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  // Only in browser
  if (typeof window === 'undefined') {
    return null
  }

  if (supabase) return supabase
  
  try {
    supabase = createClient()
    return supabase
  } catch (error) {
    // Return null during build/invalid env
    console.warn('Supabase client creation failed:', error)
    return null
  }
}

// For backward compatibility - lazy getter that's safe for SSR
export { getSupabase as supabase }
