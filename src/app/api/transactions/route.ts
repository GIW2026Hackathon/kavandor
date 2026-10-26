import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuthenticatedApi } from '@/lib/api-route';
import { calculateTransactionProceeds } from '@/calculations/transactionProceeds';

const transactionCostsSchema = z.array(z.object({
  currency: z.string(),
  amount: z.union([z.string(), z.number()]),
}));

export async function GET(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'operations_admin'], async ({ supabase }) => {
    const { data, error } = await supabase.from('transactions').select('*, transaction_costs(*)')
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    const transactions = (data ?? []).map((transaction) => {
      const costs = transactionCostsSchema.parse(transaction.transaction_costs ?? []);
      const proceeds = calculateTransactionProceeds({
        agreedPricePerKg: transaction.agreed_price === null ? null : Number(transaction.agreed_price),
        agreedQuantityKg: transaction.agreed_quantity_kg === null ? null : Number(transaction.agreed_quantity_kg),
        actualReceivedKg: transaction.actual_received_kg === null ? null : Number(transaction.actual_received_kg),
        currency: transaction.currency,
        costs: costs.map((cost) => ({ amount: Number(cost.amount), currency: cost.currency })),
      });
      return {
        ...transaction,
        ...proceeds,
      };
    });
    return NextResponse.json({ transactions });
  });
}
