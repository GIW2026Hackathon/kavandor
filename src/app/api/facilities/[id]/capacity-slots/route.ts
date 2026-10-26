import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'facility_operator', 'operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    const { data, error } = await supabase.from('capacity_slots')
      .select('id, facility_id, capacity_kg, reserved_kg, window_start, window_end')
      .eq('facility_id', id).order('window_start', { ascending: true }).limit(200);
    if (error) throw error;
    return NextResponse.json({
      capacitySlots: (data ?? []).map((slot) => ({
        ...slot,
        available_kg: Math.max(0, Number(slot.capacity_kg) - Number(slot.reserved_kg)),
      })),
    });
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  return withAuthenticatedApi(request, ['facility_operator', 'operations_admin'], async ({ supabase }) => {
    const input = z.object({
      capacityKg: z.number().positive().finite(),
      windowStart: z.string().datetime(),
      windowEnd: z.string().datetime(),
    }).strict().parse(await readJson(request));
    const { id } = await params;
    const { data, error } = await supabase.rpc('kavandor_create_capacity_slot', {
      p_facility_id: id,
      p_capacity_kg: input.capacityKg,
      p_window_start: input.windowStart,
      p_window_end: input.windowEnd,
    }).single();
    if (error) throw error;
    return NextResponse.json({ capacitySlot: data }, { status: 201 });
  });
}
