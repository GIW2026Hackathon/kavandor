import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';
import { reserveFacility } from '@/lib/server-backend';

export async function POST(request: Request) {
  return withAuthenticatedApi(request, ['farmer'], async ({ supabase }) => {
    const reservation = await reserveFacility(supabase, await readJson(request));
    return NextResponse.json({ reservation }, { status: 201 });
  });
}

export async function GET(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'facility_operator', 'operations_admin'], async ({ actor, supabase }) => {
    let query = supabase.from('reservations')
      .select('*, facilities(name, county, location), harvests!inner(crop, quantity, unit, harvest_date, farmer_id)')
      .order('created_at', { ascending: false }).limit(100);
    if (actor.role === 'farmer') query = query.eq('harvests.farmer_id', actor.userId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ reservations: data ?? [] });
  });
}
