import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';
import { transitionOffer } from '@/lib/server-backend';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    const offer = await transitionOffer(supabase, id, await readJson(request));
    return NextResponse.json({ offer });
  });
}
