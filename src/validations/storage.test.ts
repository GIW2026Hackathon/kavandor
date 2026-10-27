import { describe, expect, it } from 'vitest';
import { storageRequestSchema, transportRequestSchema } from './storage';

const storageRequest = {
  harvestId: '33333333-3333-3333-3333-333333333333',
  facilityId: 'facility-01',
  requestedQuantity: 220,
  quantityUnit: 'kg',
  requestedStartAt: '2026-10-27T08:00:00Z',
  expectedEndAt: '2026-11-03T08:00:00Z',
  storageRequirements: 'Keep tomatoes ventilated.',
  transportPreference: 'songa_provider',
};

describe('storage request validation', () => {
  it('accepts a valid tomato storage request', () => {
    expect(storageRequestSchema.parse(storageRequest)).toMatchObject(storageRequest);
  });

  it('rejects an end date before arrival', () => {
    expect(storageRequestSchema.safeParse({ ...storageRequest, expectedEndAt: storageRequest.requestedStartAt }).success).toBe(false);
  });

  it('rejects negative quantities', () => {
    expect(storageRequestSchema.safeParse({ ...storageRequest, requestedQuantity: -1 }).success).toBe(false);
  });
});

describe('transport request validation', () => {
  it('requires pickup and destination', () => {
    const result = transportRequestSchema.safeParse({
      harvestId: storageRequest.harvestId,
      pickupLocation: 'Nyakundi farm',
      destinationLocation: 'Kisii Central Cold Store Hub',
      requestedQuantity: 220,
      quantityUnit: 'kg',
      requestedPickupAt: '2026-10-27T07:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid package count', () => {
    const result = transportRequestSchema.safeParse({
      harvestId: storageRequest.harvestId,
      pickupLocation: 'Nyakundi farm',
      destinationLocation: 'Kisii Central Cold Store Hub',
      requestedQuantity: 220,
      quantityUnit: 'kg',
      packageCount: 0,
      requestedPickupAt: '2026-10-27T07:00:00Z',
    });
    expect(result.success).toBe(false);
  });
});
