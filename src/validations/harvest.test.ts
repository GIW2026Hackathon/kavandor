import { describe, expect, it } from 'vitest';
import { harvestSchema } from './harvest';

describe('harvestSchema', () => {
  it('accepts valid tomato harvest data', () => {
    const result = harvestSchema.parse({
      crop: 'Tomato',
      quantity: 220,
      unit: 'kg',
      harvestDate: '2026-10-26T08:00:00+03:00',
      location: 'Kisii County',
    });

    expect(result.crop).toBe('Tomato');
  });

  it('rejects invalid quantity', () => {
    expect(() =>
      harvestSchema.parse({
        crop: 'Tomato',
        quantity: 0,
        unit: 'kg',
        harvestDate: '2026-10-26T08:00:00+03:00',
        location: 'Kisii County',
      }),
    ).toThrow();
  });
});
