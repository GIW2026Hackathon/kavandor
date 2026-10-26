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

export async function createSupabaseServerClient(): Promise<ServerSupabaseClient> {
  const { url, key } = requireSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}

export function createSupabaseTokenClient(accessToken: string): ServerSupabaseClient {
  const { url, key } = requireSupabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export function createSupabasePublicClient(): ServerSupabaseClient {
  const { url, key } = requireSupabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
