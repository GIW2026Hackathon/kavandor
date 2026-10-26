import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env, hasSupabaseConfig } from '@/lib/env';

/**
 * Creates a Supabase client for Next.js Server Components, Server Actions,
 * and Route Handlers with cookie-based session management.
 */
export async function createSupabaseServerClient() {
  if (!hasSupabaseConfig || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Can be ignored in Server Components where cookies cannot be set
          }
        },
      },
    },
  );
}

/**
 * Creates an elevated Supabase client with the service role key for administrative tasks,
 * background orchestration jobs, and seed/migration routines.
 */
export function createSupabaseAdminClient() {
  if (!hasSupabaseConfig || !env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  const secretKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!secretKey) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
