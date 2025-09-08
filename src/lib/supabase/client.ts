import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types.generated'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// For backward compatibility, create a singleton instance
export const supabase = createClient()
