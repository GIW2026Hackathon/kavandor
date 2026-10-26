import type { UserRole, AuthContext } from '@/lib/auth-types';
import { createSupabaseServerClient, createSupabaseTokenClient } from '@/lib/supabase-server';
import type { ServerSupabaseClient } from '@/lib/supabase-server';
import { ApiError } from '@/lib/api-errors';

export interface AuthenticatedRequestContext {
  actor: AuthContext;
  supabase: ServerSupabaseClient;
}

const validRoles: UserRole[] = [
  'farmer',
  'buyer',
  'facility_operator',
  'transport_provider',
  'operations_admin',
];

export async function authenticateRequest(request: Request): Promise<AuthenticatedRequestContext> {
  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabase = bearerToken
    ? createSupabaseTokenClient(bearerToken)
    : await createSupabaseServerClient();
  const { data: { user }, error: authError } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (authError || !user) {
    throw new ApiError('UNAUTHENTICATED', 'A valid sign-in session is required.', 401);
  }

  const { data: profiles, error: profileError } = await supabase.rpc('kavandor_ensure_profile');
  if (profileError) {
    console.error('Auth profile initialization failed:', profileError.code);
    throw new ApiError('PROFILE_UNAVAILABLE', 'Your account profile could not be loaded.', 503);
  }
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  const role = profile?.role;

  if (typeof role !== 'string' || !validRoles.includes(role as UserRole)) {
    throw new ApiError('INVALID_PROFILE', 'Your account role is not configured.', 403);
  }

  return {
    actor: { userId: user.id, role: role as UserRole },
    supabase,
  };
}

export function requireRole(actor: AuthContext, roles: readonly UserRole[]) {
  if (!roles.includes(actor.role)) {
    throw new ApiError('FORBIDDEN', 'You do not have permission to perform this action.', 403);
  }
}
