import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

const updateReservationSchema = z.object({
  status: z.enum(['pending', 'quoted', 'confirmed', 'released', 'completed']).optional(),
  quoteAmount: z.number().positive().finite().optional(),
  quoteNotes: z.string().max(2000).optional(),
  providerNotes: z.string().max(2000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer', 'facility_operator', 'operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    const body = await readJson(request);
    const payload = updateReservationSchema.parse(body);

    let updatedRecord: Record<string, unknown> | null = null;

    // 1. If status is changing to confirmed/released/completed, invoke the state-machine RPC if available
    if (payload.status && ['confirmed', 'released', 'completed'].includes(payload.status)) {
      try {
        const { data, error } = await supabase.rpc('kavandor_reservation_status', {
          p_reservation_id: id,
          p_next_status: payload.status,
        }).single();
        if (!error && data) {
          updatedRecord = data as Record<string, unknown>;
        }
      } catch {
        // Fall back to table update
      }
    }

    // 2. Direct table update to persist quote amount, notes, or status
    const updateFields: Record<string, unknown> = {};
    if (payload.status) updateFields.status = payload.status;
    if (payload.quoteAmount !== undefined) updateFields.quote_amount = payload.quoteAmount;
    if (payload.quoteNotes !== undefined) updateFields.quote_notes = payload.quoteNotes;
    if (payload.providerNotes !== undefined) updateFields.provider_notes = payload.providerNotes;

    if (Object.keys(updateFields).length > 0) {
      const { data: tableData, error: tableError } = await supabase
        .from('reservations')
        .update(updateFields)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (!tableError && tableData) {
        updatedRecord = tableData as Record<string, unknown>;
      } else if (tableError && !updatedRecord) {
        throw tableError;
      }
    }

    // 3. Log event
    try {
      await supabase.from('activity_events').insert({
        event_type: 'reservation_updated',
        details: { reservation_id: id, ...payload },
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      reservation: updatedRecord || { id, status: payload.status || 'updated' },
    });
  });
}
