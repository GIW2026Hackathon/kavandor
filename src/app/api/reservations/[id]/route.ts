import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer', 'facility_operator', 'operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    const { status } = z.object({
      status: z.enum(['confirmed', 'released', 'completed']),
    }).parse(await readJson(request));
    const { data, error } = await supabase.rpc('kavandor_reservation_status', {
      p_reservation_id: id,
      p_next_status: status,
    }).single();
    if (error) throw error;
    return NextResponse.json({ reservation: data });
  });
}
