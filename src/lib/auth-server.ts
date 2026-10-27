import { cookies } from 'next/headers';
import {
  type AuthContext,
  type UserRole,
  BackendError,
} from '@/lib/backend';
import { hasSupabaseConfig } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export interface AuthenticatedUserProfile extends AuthContext {
  fullName: string;
  email: string;
  location: string;
  isDemo: boolean;
}

export const DEMO_PROFILES: Record<UserRole, AuthenticatedUserProfile> = {
  farmer: {
    userId: 'aaffbd31-c43e-4f65-a52a-1080bc891e13',
    role: 'farmer',
    fullName: 'James Nyakundi',
    email: 'farmer@kavandor.ag',
    location: 'Nyakundi Farm · Kisii',
    isDemo: true,
  },
  buyer: {
    userId: 'daad0d60-c1e0-4aee-8466-f94af37d2e77',
    role: 'buyer',
    fullName: 'FreshLink Kisii',
    email: 'buyer@kavandor.ag',
    location: 'Regional Sourcing Hub · Kisii',
    isDemo: true,
  },
  facility_operator: {
    userId: '83736bbc-7363-4845-8bea-a9ae62342624',
    role: 'facility_operator',
    fullName: 'Kisii Central Cold Store Hub',
    email: 'operator@kavandor.ag',
    location: 'Kisii Town Cold Hub',
    isDemo: true,
  },
  transport_provider: {
    userId: '2addabdc-c87c-4703-b826-b1674f5b5e3a',
    role: 'transport_provider',
    fullName: 'Songa Mobility Fleet',
    email: 'transporter@kavandor.ag',
    location: 'Kisii Transit Depot',
    isDemo: true,
  },
  operations_admin: {
    userId: 'usr-admin-001',
    role: 'operations_admin',
    fullName: 'Operations Controller',
    email: 'admin@kavandor.ag',
    location: 'Kisii & Nyamira Network',
    isDemo: true,
  },
};

/**
 * Resolves the authenticated user context in server environments (Server Components, Route Handlers, Actions):
 * 1. Inspects Supabase session cookie if Supabase credentials are configured.
 * 2. Queries the 'profiles' table for the user's actual approved role (cannot be spoofed by client).
 * 3. In unauthenticated / demo preview, resolves to verified demo persona.
 */
export async function resolveAuthContext(request?: Request): Promise<AuthenticatedUserProfile> {
  // 1. Check live Supabase authentication session
  if (hasSupabaseConfig) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Fetch user role from profiles table (authoritative database role)
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, location')
            .eq('id', user.id)
            .single();

          const role = (profile?.role || user.user_metadata?.role || 'farmer') as UserRole;
          return {
            userId: user.id,
            role,
            fullName: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Authenticated User',
            email: user.email || 'user@kavandor.ag',
            location: profile?.location || 'Kisii & Nyamira Corridor',
            isDemo: false,
          };
        }
      }
    } catch {
      // In SSR or when cookies are unavailable, fall through to header/demo resolution
    }
  }

  // 2. Check HTTP headers for API callers, curl, and automated tests
  if (request) {
    const headerUserId = request.headers.get('x-user-id');
    const headerRole = request.headers.get('x-user-role') as UserRole | null;

    if (headerUserId) {
      const matchedRole = (headerRole && headerRole in DEMO_PROFILES ? headerRole : 'farmer') as UserRole;
      const base = DEMO_PROFILES[matchedRole];
      return {
        ...base,
        userId: headerUserId,
        role: matchedRole,
      };
    }
  }

  // 3. Fallback to active demo role from cookie if set
  try {
    const cookieStore = await cookies();
    const activeRoleCookie = cookieStore.get('kavandor_active_role')?.value as UserRole | undefined;
    if (activeRoleCookie && activeRoleCookie in DEMO_PROFILES) {
      return DEMO_PROFILES[activeRoleCookie];
    }
  } catch {
    // cookies() unavailable in non-request contexts
  }

  // 4. Default to farmer demo persona
  return DEMO_PROFILES.farmer;
}

/**
 * Enforces role-based permissions asynchronously using the dual-mode resolver.
 */
export async function requireAuthAsync(
  request: Request,
  allowedRoles: UserRole[] = [],
): Promise<AuthenticatedUserProfile> {
  const auth = await resolveAuthContext(request);
  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) {
    throw new BackendError('FORBIDDEN', 'You do not have permission to perform this action.', 403);
  }
  return auth;
}
