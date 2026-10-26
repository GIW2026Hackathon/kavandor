export interface NetProceedsInput {
  quantity: number;
  unitPrice: number;
  transportCost: number;
  facilityCost: number;
  fees: number;
  dryingCost?: number;
  storageCost?: number;
}

export function calculateNetProceeds(input: NetProceedsInput): number {
  const gross = input.quantity * input.unitPrice;
  const deductions =
    input.transportCost +
    input.facilityCost +
    input.fees +
    (input.dryingCost ?? 0) +
    (input.storageCost ?? 0);

  return Number((gross - deductions).toFixed(2));
}
