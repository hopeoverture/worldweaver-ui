import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function getServerAuth() {
  // Using await here to satisfy Next's type in route handlers
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  return { user, error };
}

export async function requireAuth() {
  const { user, error } = await getServerAuth();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }
  
  return user;
}
