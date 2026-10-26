import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';
import { getHarvest, transitionHarvest, updateHarvest } from '@/lib/server-backend';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'facility_operator', 'transport_provider', 'operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    const harvest = await getHarvest(supabase, id);
    return NextResponse.json({ harvest });
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return withAuthenticatedApi(request, ['farmer'], async ({ actor, supabase }) => {
    const { id } = await params;
    const payload = await readJson(request);
    if (typeof payload === 'object' && payload !== null && 'status' in payload) {
      const harvest = await transitionHarvest(supabase, actor, id, payload);
      return NextResponse.json({ harvest });
    }
    const harvest = await updateHarvest(supabase, actor, id, payload);
    return NextResponse.json({ harvest });
  });
}
