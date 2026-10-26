import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

const costSchema = z.object({
  costType: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(500),
  amount: z.number().nonnegative().finite(),
  currency: z.string().regex(/^[A-Z]{3}$/).default('KES'),
}).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['operations_admin'], async ({ actor, supabase }) => {
    const { id } = await params;
    const input = costSchema.parse(await readJson(request));
    const { data: transaction, error: transactionError } = await supabase.from('transactions')
      .select('id, currency').eq('id', id).maybeSingle();
    if (transactionError) throw transactionError;
    if (!transaction) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found.' } }, { status: 404 });
    }
    if (transaction.currency !== input.currency) {
      return NextResponse.json({
        error: { code: 'CURRENCY_MISMATCH', message: 'Cost currency must match the transaction currency.' },
      }, { status: 400 });
    }
    const { data, error } = await supabase.from('transaction_costs').insert({
      transaction_id: id,
      cost_type: input.costType,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      source: 'manual',
      recorded_by: actor.userId,
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ cost: data }, { status: 201 });
  });
}
