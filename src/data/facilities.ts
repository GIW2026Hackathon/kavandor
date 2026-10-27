export type CertifiedFacility = {
  id: string;
  name: string;
  locality: string;
  county: 'Kisii' | 'Nyamira';
  facilityType: 'cold_storage' | 'ambient' | 'drying';
  storageTypes: Array<'cold' | 'ambient' | 'dry'>;
  acceptedCommodities: string[];
  description: string;
  availableCapacityKg: number;
  pricePerUnit: number;
  priceUnit: 'kg';
  pricePeriod: 'day';
  temperatureC: number;
  humidityPercent: number;
  readingObservedAt: string;
  imageUrl: string;
  imageAlt: string;
  source: 'provider_confirmed' | 'provider_reported' | 'manually_entered' | 'demo_data';
  verificationStatus: 'verified' | 'unverified';
};

export type FacilityRecord = CertifiedFacility;
export type DemoFacility = CertifiedFacility;

export const certifiedFacilities: CertifiedFacility[] = [
  {
    id: 'f0000001-0000-0000-0000-000000000001',
    name: 'Kisii Central Cold Store Hub',
    locality: 'Kisii Town',
    county: 'Kisii',
    facilityType: 'cold_storage',
    storageTypes: ['cold'],
    acceptedCommodities: ['Tomatoes', 'Avocados', 'Bananas'],
    description: 'Certified precision cold room operating at 11-13°C with solar backup power, digital intake scales, and active ethylene scrubbing.',
    availableCapacityKg: 840,
    pricePerUnit: 3.2,
    priceUnit: 'kg',
    pricePeriod: 'day',
    temperatureC: 11.8,
    humidityPercent: 82,
    readingObservedAt: '2026-10-26T09:20:00Z',
    imageUrl: '/storage/cold-store.jpg',
    imageAlt: 'Kisii Central Cold Store Hub climate-controlled pallet bays',
    source: 'provider_confirmed',
    verificationStatus: 'verified',
  },
  {
    id: 'f0000002-0000-0000-0000-000000000002',
    name: 'Nyamira Ventilated Storage Center',
    locality: 'Nyamira Town',
    county: 'Nyamira',
    facilityType: 'ambient',
    storageTypes: ['ambient'],
    acceptedCommodities: ['Tomatoes', 'Onions', 'Potatoes'],
    description: 'Active ventilated aggregation and sorting center for rapid post-harvest handling, grading, and short-term holding.',
    availableCapacityKg: 460,
    pricePerUnit: 1.8,
    priceUnit: 'kg',
    pricePeriod: 'day',
    temperatureC: 21.4,
    humidityPercent: 68,
    readingObservedAt: '2026-10-26T08:45:00Z',
    imageUrl: '/storage/ambient-store.jpg',
    imageAlt: 'Nyamira Ventilated Storage Center produce sorting and aggregation crates',
    source: 'provider_confirmed',
    verificationStatus: 'verified',
  },
  {
    id: 'f0000003-0000-0000-0000-000000000003',
    name: 'Keumbu Solar Dehydration Facility',
    locality: 'Keumbu',
    county: 'Kisii',
    facilityType: 'drying',
    storageTypes: ['dry'],
    acceptedCommodities: ['Maize', 'Bananas', 'Tomatoes'],
    description: 'Regional solar dehydration and value-addition facility producing certified packaged shelf-stable produce.',
    availableCapacityKg: 1200,
    pricePerUnit: 2.4,
    priceUnit: 'kg',
    pricePeriod: 'day',
    temperatureC: 24.2,
    humidityPercent: 56,
    readingObservedAt: '2026-10-26T07:30:00Z',
    imageUrl: '/storage/dry-handling.jpg',
    imageAlt: 'Keumbu Solar Dehydration Facility clean drying and packaging zone',
    source: 'provider_confirmed',
    verificationStatus: 'verified',
  },
];

export function findFacility(id: string): CertifiedFacility | undefined {
  const matchId: Record<string, string> = {
    'facility-01': 'f0000001-0000-0000-0000-000000000001',
    'facility-02': 'f0000002-0000-0000-0000-000000000002',
    'facility-03': 'f0000003-0000-0000-0000-000000000003',
  };
  const targetId = matchId[id] || id;
  return certifiedFacilities.find((item) => item.id === targetId || item.id === id);
}
