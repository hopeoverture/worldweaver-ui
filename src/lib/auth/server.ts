import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types.generated'
import { logAuthError } from '@/lib/logging'

export async function getServerAuth() {
  // Using await here to satisfy Next's type in route handlers
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing in auth server', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    return {
      user: null,
      error: new Error('Supabase credentials not configured')
    }
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            logAuthError('cookie_set', error as Error, { 
              action: 'cookie_set',
              metadata: { cookieName: name }
            })
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            logAuthError('cookie_remove', error as Error, { 
              action: 'cookie_remove',
              metadata: { cookieName: name }
            })
          }
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    logAuthError('get_server_user', error, { action: 'get_server_user' })
  }

  return { user, error }
}

export async function requireAuth() {
  const { user, error } = await getServerAuth();
  
  if (error) {
    logAuthError('require_auth', error, { action: 'require_auth' })
    throw new Error('Authentication failed: ' + error.message);
  }
  
  if (!user) {
    const authError = new Error('Authentication required')
    logAuthError('require_auth', authError, { action: 'require_auth_no_user' })
    throw authError;
  }
  
  return user;
}

// Return the same Supabase server client instance and the current user.
export async function getServerClientAndUser() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing in getServerClientAndUser', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
    return {
      supabase: null,
      user: null,
      error: new Error('Supabase credentials not configured')
    }
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            logAuthError('cookie_set_client', error as Error, { 
              action: 'cookie_set_client',
              metadata: { cookieName: name }
            })
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            logAuthError('cookie_remove_client', error as Error, { 
              action: 'cookie_remove_client',
              metadata: { cookieName: name }
            })
          }
        },
      },
    }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    logAuthError('get_server_client_user', error, { action: 'get_server_client_user' })
  }
  
  return { supabase, user, error }
}
