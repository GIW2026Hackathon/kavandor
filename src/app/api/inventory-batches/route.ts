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
  return withAuthenticatedApi(request, ['farmer', 'facility_operator', 'operations_admin'], async ({ supabase }) => {
    const { data, error } = await supabase.from('inventory_batches').select('*')
      .order('received_at', { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ inventoryBatches: data ?? [] });
  });
}
