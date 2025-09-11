import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { requireEnv } from '@/lib/env'

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
