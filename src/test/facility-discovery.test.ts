import { describe, expect, it } from 'vitest';
import { estimateServiceCost, facilityBenefit, facilityCategory, getMatchingSlot, normalizeCommodity } from '../lib/facility-discovery';
import type { Facility } from '../types/facility';

function futureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function facility(overrides: Partial<Facility> = {}): Facility {
  return {
    id: 'facility-1',
    name: 'Test facility',
    county: 'Kisii',
    location: 'Kisii Town',
    type: 'cold_storage',
    description: null,
    address: null,
    latitude: null,
    longitude: null,
    facilityType: 'cold_storage',
    acceptedCommodities: ['Tomatoes'],
    storageTypes: ['cold'],
    pricePerUnit: 3,
    priceUnit: 'kg',
    pricePeriod: 'day',
    minimumQuantity: null,
    capacityUnit: 'kg',
    conditionTargets: null,
    verificationStatus: 'provider_reported',
    verifiedAt: null,
    isDemo: false,
    source: 'provider_reported',
    createdAt: new Date().toISOString(),
    availabilityUpdatedAt: null,
    availabilitySlots: [{
      id: 'slot-1',
      capacityKg: 500,
      reservedKg: 100,
      availableCapacityKg: 400,
      windowStart: new Date(`${futureDate(1)}T07:00:00`).toISOString(),
      windowEnd: new Date(`${futureDate(4)}T09:00:00`).toISOString(),
    }],
    ...overrides,
  };
}

describe('facility discovery calculations', () => {
  it('matches common crop plurals to provider-listed singular names', () => {
    expect(normalizeCommodity('Tomatoes')).toBe('tomato');
    expect(normalizeCommodity('Berries')).toBe('berry');
    expect(normalizeCommodity('Apples')).toBe('apple');
  });

  it('classifies services and explains benefits without promising higher returns', () => {
    const coldRoom = facility();
    expect(facilityCategory(coldRoom)).toBe('Cold storage');
    expect(facilityBenefit(coldRoom).summary).toContain('may slow quality loss');
    expect(facilityBenefit(coldRoom).limitation).toContain('no price increase is guaranteed');
  });

  it('estimates a listed per-kilogram daily fee and does not infer unavailable prices', () => {
    expect(estimateServiceCost(facility(), 50, 3)).toBe(450);
    expect(estimateServiceCost(facility({ pricePerUnit: null }), 50, 3)).toBeNull();
    expect(estimateServiceCost(facility({ priceUnit: 'crate' }), 50, 3)).toBeNull();
  });

  it('matches only capacity slots that cover the requested date range and quantity', () => {
    const coldRoom = facility();
    const start = futureDate(2);
    expect(getMatchingSlot(coldRoom, start, 1, 200)?.id).toBe('slot-1');
    expect(getMatchingSlot(coldRoom, start, 1, 401)).toBeNull();
    expect(getMatchingSlot(coldRoom, futureDate(5), 1, 200)).toBeNull();
    expect(getMatchingSlot(coldRoom, start, 1, 200, futureDate(3))).toBeNull();
  });
});
