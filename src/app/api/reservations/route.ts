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
  return withAuthenticatedApi(request, ['farmer', 'facility_operator', 'operations_admin'], async ({ supabase }) => {
    const { data, error } = await supabase.from('reservations').select('*')
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ reservations: data ?? [] });
  });
}
