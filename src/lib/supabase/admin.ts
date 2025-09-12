import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types.generated';

// Check if we have valid Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: ReturnType<typeof createClient<Database>> | null = null

if (supabaseUrl && supabaseServiceKey) {
  
  adminClient = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
} else {
  console.warn('Admin Supabase client not initialized - invalid credentials')
}

export { adminClient }