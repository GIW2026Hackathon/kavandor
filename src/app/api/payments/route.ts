import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

export async function GET(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'operations_admin'], async ({ supabase }) => {
    const { data, error } = await supabase.from('payment_records').select('*')
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({
      payments: data ?? [],
      integration: { mode: 'manual_records_only', liveProviderConfigured: false },
    });
  });
}

export async function POST(request: Request) {
  return withAuthenticatedApi(request, ['operations_admin'], async ({ actor, supabase }) => {
    const input = z.object({
      transactionId: z.string().uuid(),
      amount: z.number().nonnegative().finite(),
      currency: z.string().regex(/^[A-Z]{3}$/).default('KES'),
      status: z.enum(['pending', 'paid', 'failed', 'reversed']).default('pending'),
    }).strict().parse(await readJson(request));
    const { data: transaction, error: transactionError } = await supabase.from('transactions')
      .select('id, currency').eq('id', input.transactionId).maybeSingle();
    if (transactionError) throw transactionError;
    if (!transaction) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found.' } }, { status: 404 });
    }
    if (transaction.currency !== input.currency) {
      return NextResponse.json({
        error: { code: 'CURRENCY_MISMATCH', message: 'Payment currency must match the transaction currency.' },
      }, { status: 400 });
    }
    const { data, error } = await supabase.from('payment_records').insert({
      transaction_id: input.transactionId,
      amount: input.amount,
      currency: input.currency,
      status: input.status,
      source: 'manual',
      recorded_by: actor.userId,
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json({
      payment: data,
      integration: { mode: 'manual_records_only', liveProviderConfigured: false },
    }, { status: 201 });
  });
}
