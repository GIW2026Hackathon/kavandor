import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env, hasSupabaseConfig } from '@/lib/env';

export type ServerSupabaseClient = SupabaseClient;

function requireSupabaseConfig() {
  if (!hasSupabaseConfig || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured.');
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * Creates a Supabase client for Next.js Server Components, Server Actions,
 * and Route Handlers with cookie-based session management.
 */
export async function createSupabaseServerClient(): Promise<ServerSupabaseClient> {
  const { url, key } = requireSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Can be ignored in Server Components where cookies cannot be set
        }
      },
    },
  });
}

/**
 * Creates a Supabase client authenticated with a Bearer access token.
 */
export function createSupabaseTokenClient(accessToken: string): ServerSupabaseClient {
  const { url, key } = requireSupabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Creates an unauthenticated public Supabase client.
 */
export function createSupabasePublicClient(): ServerSupabaseClient {
  const { url, key } = requireSupabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Creates an elevated Supabase client with the service role key for administrative tasks,
 * background orchestration jobs, and seed/migration routines.
 */
export function createSupabaseAdminClient(): ServerSupabaseClient | null {
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
