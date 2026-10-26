import { createBrowserClient } from '@supabase/ssr';
import { hasPublicSupabaseConfig, publicEnv } from '@/lib/public-env';

export function getSupabaseBrowserClient() {
  if (!hasPublicSupabaseConfig || !publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  return createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
