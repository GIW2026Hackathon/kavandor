import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';
import { createHarvest, listHarvests } from '@/lib/server-backend';

export async function POST(request: Request) {
  return withAuthenticatedApi(request, ['farmer'], async ({ supabase }) => {
    const harvest = await createHarvest(supabase, await readJson(request));
    return NextResponse.json({ harvest }, { status: 201 });
  });
}

export async function GET(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'operations_admin'], async ({ supabase }) => {
    const harvests = await listHarvests(supabase);
    return NextResponse.json({ harvests });
  });
}
