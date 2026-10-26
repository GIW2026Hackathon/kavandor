export interface TransactionCostInput {
  amount: number;
  currency: string;
}

export interface TransactionProceedsInput {
  agreedPricePerKg: number | null;
  agreedQuantityKg: number | null;
  actualReceivedKg: number | null;
  currency: string;
  costs: TransactionCostInput[];
}

export function calculateTransactionProceeds(input: TransactionProceedsInput) {
  const values = [
    input.agreedPricePerKg,
    input.agreedQuantityKg,
    input.actualReceivedKg,
    ...input.costs.map((cost) => cost.amount),
  ];
  if (values.some((value) => value !== null && (!Number.isFinite(value) || value < 0))) {
    throw new RangeError('Transaction prices, quantities, and costs must be finite and non-negative.');
  }
  if (!/^[A-Z]{3}$/.test(input.currency) || input.costs.some((cost) => cost.currency !== input.currency)) {
    throw new RangeError('All transaction cost currencies must match the transaction currency.');
  }

  const totalCosts = roundCurrency(input.costs.reduce((sum, cost) => sum + cost.amount, 0));
  const billableQuantityKg = input.actualReceivedKg === null
    ? null
    : Math.min(input.actualReceivedKg, input.agreedQuantityKg ?? input.actualReceivedKg);
  const grossProceeds = billableQuantityKg === null || input.agreedPricePerKg === null
    ? null
    : roundCurrency(input.agreedPricePerKg * billableQuantityKg);

  return {
    billableQuantityKg,
    grossProceeds,
    totalCosts,
    netProceeds: grossProceeds === null ? null : roundCurrency(grossProceeds - totalCosts),
  };
}

function roundCurrency(value: number) {
  if (!Number.isFinite(value)) {
    throw new RangeError('Calculated transaction proceeds must be finite.');
  }
  return Number(value.toFixed(2));
}
