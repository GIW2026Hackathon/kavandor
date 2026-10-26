import { describe, expect, it } from 'vitest';
import { calculateTransactionProceeds } from './transactionProceeds';

describe('calculateTransactionProceeds', () => {
  it('calculates gross and net from received quantity and recorded costs', () => {
    expect(calculateTransactionProceeds({
      agreedPricePerKg: 45,
      agreedQuantityKg: 200,
      actualReceivedKg: 180,
      currency: 'KES',
      costs: [
        { amount: 450, currency: 'KES' },
        { amount: 240.5, currency: 'KES' },
      ],
    })).toEqual({
      billableQuantityKg: 180,
      grossProceeds: 8100,
      totalCosts: 690.5,
      netProceeds: 7409.5,
    });
  });

  it('caps billable quantity at the accepted offer while preserving the received quantity', () => {
    expect(calculateTransactionProceeds({
      agreedPricePerKg: 12,
      agreedQuantityKg: 50,
      actualReceivedKg: 65,
      currency: 'KES',
      costs: [],
    })).toMatchObject({ billableQuantityKg: 50, grossProceeds: 600 });
  });

  it('does not invent proceeds before actual received quantity is recorded', () => {
    expect(calculateTransactionProceeds({
      agreedPricePerKg: 12,
      agreedQuantityKg: 50,
      actualReceivedKg: null,
      currency: 'KES',
      costs: [],
    })).toMatchObject({ billableQuantityKg: null, grossProceeds: null, netProceeds: null });
  });

  it('rejects invalid quantities and mixed currencies', () => {
    const base = {
      agreedPricePerKg: 12,
      agreedQuantityKg: 50,
      actualReceivedKg: 40,
      currency: 'KES',
      costs: [],
    };
    expect(() => calculateTransactionProceeds({ ...base, actualReceivedKg: -1 })).toThrow(RangeError);
    expect(() => calculateTransactionProceeds({
      ...base,
      costs: [{ amount: 10, currency: 'USD' }],
    })).toThrow(RangeError);
  });
});
