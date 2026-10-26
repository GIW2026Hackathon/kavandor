import { describe, expect, it } from 'vitest';
import { calculateNetProceeds } from './netProceeds';

describe('calculateNetProceeds', () => {
  it('calculates net proceeds after costs and fees', () => {
    const net = calculateNetProceeds({
      quantity: 200,
      unitPrice: 45,
      transportCost: 450,
      facilityCost: 240,
      fees: 110,
    });

    expect(net).toBe(8200);
  });
});
