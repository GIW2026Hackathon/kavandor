import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env, hasSupabaseConfig } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

const VALID_ROLES = ['farmer', 'buyer', 'facility_operator', 'transport_provider'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

const ROLE_DESTINATIONS: Record<ValidRole, string> = {
  farmer: '/dashboard',
  buyer: '/marketplace',
  facility_operator: '/partners',
  transport_provider: '/transport',
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const roleParam = searchParams.get('role');
  const requestedNext = searchParams.get('next');

  if (!hasSupabaseConfig || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent('Supabase is not configured for authentication.')}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent('Missing OAuth code.')}`);
  }

  const cookieStore = await cookies();
  const cookieRole = cookieStore.get('kavandor_auth_role')?.value;

  const rawRole = (roleParam || cookieRole || 'farmer') as ValidRole;
  const targetRole: ValidRole = VALID_ROLES.includes(rawRole) ? rawRole : 'farmer';

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(error.message)}`);
  }

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (user) {
    // 1. Update user metadata with the designated role
    await supabase.auth.updateUser({
      data: {
        account_role: targetRole,
        role: targetRole,
      },
    });

    // 2. Synchronize profile in PostgreSQL profiles table via admin client
    const admin = createSupabaseAdminClient();
    if (admin) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'KAVANDOR Member';
      
      const { error: profileErr } = await admin.from('profiles').upsert(
        {
          id: user.id,
          email: user.email!,
          full_name: fullName,
          role: targetRole,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

      if (profileErr) {
        console.warn('[AUTH CALLBACK] Profile upsert notice:', profileErr.message);
      }

      // If registered as buyer, ensure commercial buyers table entry exists
      if (targetRole === 'buyer') {
        const { error: buyerErr } = await admin.from('buyers').upsert(
          {
            profile_id: user.id,
            company_name: fullName,
            location: 'Kisii / Regional Wholesale Market',
          },
          { onConflict: 'profile_id' },
        );
        if (buyerErr) {
          console.warn('[AUTH CALLBACK] Buyer upsert notice:', buyerErr.message);
        }
      }
    }
  }

  const destination = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : ROLE_DESTINATIONS[targetRole];

  const response = NextResponse.redirect(new URL(destination, origin));
  response.cookies.set('kavandor_active_role', targetRole, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  });
  response.cookies.delete('kavandor_auth_role');

  return response;
}
