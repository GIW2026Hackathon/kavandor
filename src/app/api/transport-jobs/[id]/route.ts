import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';
import { transitionTransport } from '@/lib/server-backend';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer', 'transport_provider', 'operations_admin'], async ({ actor, supabase }) => {
    const { id } = await params;
    const job = await transitionTransport(supabase, actor, id, await readJson(request));
    return NextResponse.json({ transportRequest: job });
  });
}
