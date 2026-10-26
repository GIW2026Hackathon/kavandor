import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['operations_admin'], async ({ actor, supabase }) => {
    const { status } = z.object({
      status: z.enum(['pending', 'paid', 'failed', 'reversed']),
    }).strict().parse(await readJson(request));
    const { id } = await params;
    const { data, error } = await supabase.from('payment_records').update({
      status,
      recorded_by: actor.userId,
    }).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Payment record not found.' } }, { status: 404 });
    }
    return NextResponse.json({
      payment: data,
      integration: { mode: 'manual_records_only', liveProviderConfigured: false },
    });
  });
}
