export type DemoFacility = {
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
  source: 'demo_data';
  verificationStatus: 'unverified';
};

export const demoFacilities: DemoFacility[] = [
  {
    id: 'facility-01',
    name: 'Kisii Cold Store Demo',
    locality: 'Kisii Town',
    county: 'Kisii',
    facilityType: 'cold_storage',
    storageTypes: ['cold'],
    acceptedCommodities: ['Tomatoes', 'Avocados', 'Bananas'],
    description: 'Fictional ventilated cold room for demo comparison. No live operation or certification is implied.',
    availableCapacityKg: 840,
    pricePerUnit: 3.2,
    priceUnit: 'kg',
    pricePeriod: 'day',
    temperatureC: 11.8,
    humidityPercent: 82,
    readingObservedAt: '2026-10-26T09:20:00Z',
    imageUrl: '/storage/cold-store.jpg',
    imageAlt: 'Illustrative warehouse with rows of stacked storage pallets',
    source: 'demo_data',
    verificationStatus: 'unverified',
  },
  {
    id: 'facility-02',
    name: 'Nyamira Ventilated Store Demo',
    locality: 'Nyamira Town',
    county: 'Nyamira',
    facilityType: 'ambient',
    storageTypes: ['ambient'],
    acceptedCommodities: ['Tomatoes', 'Onions', 'Potatoes'],
    description: 'Fictional ambient store for short-duration handling. Capacity and conditions are sample data.',
    availableCapacityKg: 460,
    pricePerUnit: 1.8,
    priceUnit: 'kg',
    pricePeriod: 'day',
    temperatureC: 21.4,
    humidityPercent: 68,
    readingObservedAt: '2026-10-26T08:45:00Z',
    imageUrl: '/storage/ambient-store.jpg',
    imageAlt: 'Illustrative produce market with fresh vegetables in crates',
    source: 'demo_data',
    verificationStatus: 'unverified',
  },
  {
    id: 'facility-03',
    name: 'Keumbu Dry Handling Demo',
    locality: 'Keumbu',
    county: 'Kisii',
    facilityType: 'drying',
    storageTypes: ['dry'],
    acceptedCommodities: ['Maize', 'Bananas'],
    description: 'Fictional dry handling and dehydration demonstration facility for suitable commodities.',
    availableCapacityKg: 1200,
    pricePerUnit: 2.4,
    priceUnit: 'kg',
    pricePeriod: 'day',
    temperatureC: 24.2,
    humidityPercent: 56,
    readingObservedAt: '2026-10-26T07:30:00Z',
    imageUrl: '/storage/dry-handling.jpg',
    imageAlt: 'Illustrative maize crop being handled in a drying area',
    source: 'demo_data',
    verificationStatus: 'unverified',
  },
];
