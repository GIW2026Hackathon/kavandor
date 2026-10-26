import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env, hasSupabaseConfig } from '@/lib/env';

export async function POST() {
  if (!hasSupabaseConfig || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL('/auth/signin', 'http://localhost:3000'));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/auth/signin', 'http://localhost:3000'));
}
