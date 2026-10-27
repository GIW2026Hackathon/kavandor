import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';
import { receiveInventory } from '@/lib/server-backend';

export async function POST(request: Request) {
  return withAuthenticatedApi(request, ['facility_operator', 'operations_admin'], async ({ supabase }) => {
    const batch = await receiveInventory(supabase, await readJson(request));
    return NextResponse.json({ inventoryBatch: batch }, { status: 201 });
  });
}

export async function GET(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'facility_operator', 'operations_admin'], async ({ actor, supabase }) => {
    let query = supabase.from('inventory_batches').select(`
      id,
      harvest_id,
      facility_id,
      reservation_id,
      actual_received_kg,
      discrepancy_kg,
      status,
      received_at,
      harvests!inner (crop, quantity, unit, farmer_id),
      facilities (name, location, county)
    `).order('received_at', { ascending: false }).limit(100);
    if (actor.role === 'farmer') query = query.eq('harvests.farmer_id', actor.userId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ inventoryBatches: data ?? [] });
  });
}
