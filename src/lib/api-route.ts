import { unstable_rethrow } from 'next/navigation';
import { authenticateRequest, requireRole } from '@/lib/api-auth';
import { handleApiError } from '@/lib/api-errors';
import type { UserRole } from '@/lib/auth-types';
import type { AuthenticatedRequestContext } from '@/lib/api-auth';

export async function withAuthenticatedApi(
  request: Request,
  roles: readonly UserRole[],
  handler: (context: AuthenticatedRequestContext) => Promise<Response>,
) {
  try {
    const context = await authenticateRequest(request);
    requireRole(context.actor, roles);
    return await handler(context);
  } catch (error) {
    unstable_rethrow(error);
    return handleApiError(error);
  }
}

export async function withPublicApi(handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    unstable_rethrow(error);
    return handleApiError(error);
  }
}
