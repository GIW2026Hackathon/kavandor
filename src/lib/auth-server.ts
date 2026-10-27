import {
  type AuthContext,
  type UserRole,
  BackendError,
} from '@/lib/backend';
import { hasSupabaseConfig } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const DEFAULT_FARMER_ID = 'usr-farmer-001';

/**
 * Resolves the authenticated user context in server environments (Route Handlers, Server Actions):
 * 1. Inspects Supabase session cookie if Supabase credentials are configured.
 * 2. Checks explicit client headers ('x-user-id', 'x-user-role').
 * 3. Gracefully defaults to primary farmer context for preview.
 */
export async function resolveAuthContext(request?: Request): Promise<AuthContext> {
  // 1. Check live Supabase authentication session
  if (hasSupabaseConfig) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Fetch user role from profiles table or user metadata
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          const role = (profile?.role || user.user_metadata?.role || 'farmer') as UserRole;
          return {
            userId: user.id,
            role,
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
      return {
        userId: headerUserId,
        role: headerRole || 'farmer',
      };
    }
  }

  // 3. Fallback to default farmer
  return {
    userId: DEFAULT_FARMER_ID,
    role: 'farmer',
  };
}

/**
 * Enforces role-based permissions asynchronously using the dual-mode resolver.
 */
export async function requireAuthAsync(
  request: Request,
  allowedRoles: UserRole[] = [],
): Promise<AuthContext> {
  const auth = await resolveAuthContext(request);
  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) {
    throw new BackendError('FORBIDDEN', 'You do not have permission to perform this action.', 403);
  }
  return auth;
}
