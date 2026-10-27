export type ProviderType =
  | 'storage_facility'
  | 'processor'
  | 'cooperative'
  | 'dairy_chilling'
  | 'drying_facility'
  | 'packhouse'
  | 'commercial_buyer'
  | 'transport_provider';

export type ServiceType =
  | 'cold_storage'
  | 'ambient_storage'
  | 'processing'
  | 'drying'
  | 'grading_sorting'
  | 'dairy_chilling'
  | 'aggregation'
  | 'transport'
  | 'direct_purchase';

export interface ProviderServiceOffering {
  id: string;
  serviceType: ServiceType;
  name: string;
  description: string;
  acceptedCommodities: string[];
  pricing: {
    amount?: number;
    unit?: string;
    period?: string;
    isQuoteRequired?: boolean;
    description: string;
  };
  capacity: {
    available?: number;
    unit?: string;
    minimumOrder?: number;
  };
  turnaroundHours: number;
  requirements: string[];
}

export interface ValueAdditionProvider {
  id: string;
  name: string;
  providerType: ProviderType;
  locality: string;
  county: 'Kisii' | 'Nyamira';
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  imageUrl: string;
  imageAlt: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp: string;
  verificationStatus: 'verified' | 'unverified';
  verificationEvidence: string;
  dataSource: 'provider_confirmed' | 'provider_reported' | 'manually_entered' | 'demo_data';
  lastUpdated: string;
  services: ProviderServiceOffering[];
  operatingHours?: string;
}

export const regionalProviders: ValueAdditionProvider[] = [
  {
    id: 'f0000001-0000-0000-0000-000000000001',
    name: 'Kisii Central Cold Store Hub',
    providerType: 'storage_facility',
    locality: 'Kisii Town',
    county: 'Kisii',
    coordinates: { lat: -0.6817, lng: 34.7731 },
    description: 'Certified precision cold room operating at 11-13°C with solar backup power, digital intake scales, and active ethylene scrubbing.',
    imageUrl: '/value-addition/cold-storage.jpg',
    imageAlt: 'Kisii Central Cold Store Hub climate-controlled pallet bays',
    contactPhone: '+254 722 100 201',
    contactEmail: 'intake@kisiicoldhub.co.ke',
    contactWhatsapp: '+254 722 100 201',
    verificationStatus: 'verified',
    verificationEvidence: 'AFA Horticultural Directorate Certified Cold Facility (HCDA-2025-089)',
    dataSource: 'provider_confirmed',
    lastUpdated: '2026-10-26T09:20:00Z',
    operatingHours: '06:00 - 20:00 EAT',
    services: [
      {
        id: 'srv-001',
        serviceType: 'cold_storage',
        name: 'Precision Cold Storage Buffer',
        description: 'Climate-controlled palletized storage at 11-13°C and 85% RH for perishable crops.',
        acceptedCommodities: ['Tomatoes', 'Avocados', 'Bananas', 'Mangoes'],
        pricing: {
          amount: 3.2,
          unit: 'kg',
          period: 'day',
          isQuoteRequired: false,
          description: 'KSh 3.20 per kg per day (includes intake weighing & 24/7 solar backup power)',
        },
        capacity: {
          available: 840,
          unit: 'kg',
          minimumOrder: 50,
        },
        turnaroundHours: 2,
        requirements: ['Crates must be clean and ventilated', 'Batch free of active fungal spore rot'],
      },
    ],
  },
  {
    id: 'f0000002-0000-0000-0000-000000000002',
    name: 'Nyamira Ventilated Storage Center',
    providerType: 'storage_facility',
    locality: 'Nyamira Town',
    county: 'Nyamira',
    coordinates: { lat: -0.5633, lng: 34.9358 },
    description: 'Active ventilated aggregation and sorting center for rapid post-harvest handling, grading, and short-term holding.',
    imageUrl: '/storage/ambient-store.jpg',
    imageAlt: 'Nyamira Ventilated Storage Center produce sorting and aggregation crates',
    contactPhone: '+254 711 345 678',
    contactEmail: 'operations@nyamirastorage.co.ke',
    contactWhatsapp: '+254 711 345 678',
    verificationStatus: 'verified',
    verificationEvidence: 'County Agricultural Office Inspected Aggregation Center',
    dataSource: 'provider_confirmed',
    lastUpdated: '2026-10-26T08:45:00Z',
    operatingHours: '07:00 - 18:30 EAT',
    services: [
      {
        id: 'srv-002',
        serviceType: 'ambient_storage',
        name: 'Ventilated Ambient Curing & Holding',
        description: 'Shaded, high-airflow holding bays designed for onions, potatoes, and firm breaker tomatoes.',
        acceptedCommodities: ['Tomatoes', 'Onions', 'Potatoes', 'Sweet potatoes'],
        pricing: {
          amount: 1.8,
          unit: 'kg',
          period: 'day',
          isQuoteRequired: false,
          description: 'KSh 1.80 per kg per day',
        },
        capacity: {
          available: 460,
          unit: 'kg',
          minimumOrder: 100,
        },
        turnaroundHours: 1,
        requirements: ['Dry field condition; no moisture dripping'],
      },
    ],
  },
  {
    id: 'f0000003-0000-0000-0000-000000000003',
    name: 'Keumbu Solar Dehydration Facility',
    providerType: 'drying_facility',
    locality: 'Keumbu',
    county: 'Kisii',
    coordinates: { lat: -0.7314, lng: 34.8219 },
    description: 'Regional solar dehydration and value-addition facility producing certified packaged shelf-stable produce, flour, and dried fruit.',
    imageUrl: '/value-addition/solar-drying.jpg',
    imageAlt: 'Keumbu Solar Dehydration Facility clean drying and packaging zone',
    contactPhone: '+254 723 889 900',
    contactEmail: 'solar@keumbudehydration.org',
    contactWhatsapp: '+254 723 889 900',
    verificationStatus: 'verified',
    verificationEvidence: 'KEBS Standardized Solar Drying & Milling Facility (KEBS-AGR-491)',
    dataSource: 'provider_confirmed',
    lastUpdated: '2026-10-26T07:30:00Z',
    operatingHours: '08:00 - 17:00 EAT',
    services: [
      {
        id: 'srv-003',
        serviceType: 'drying',
        name: 'Solar Tunnel Dehydration & Slicing',
        description: 'Sanitary washing, automated slicing, solar tunnel dehydration (55-60°C), and moisture-barrier hermetic packing.',
        acceptedCommodities: ['Tomatoes', 'Bananas', 'Mangoes', 'Maize', 'Vegetables', 'Cassava'],
        pricing: {
          amount: 4.5,
          unit: 'kg',
          period: 'batch',
          isQuoteRequired: false,
          description: 'KSh 4.50 per fresh kg processed (includes slicing, drying, and sealed packaging)',
        },
        capacity: {
          available: 1200,
          unit: 'kg',
          minimumOrder: 50,
        },
        turnaroundHours: 36,
        requirements: ['Minimum 50 kg fresh batch weight', 'Produce washed or field-cleaned'],
      },
    ],
  },
  {
    id: 'p0000004-0000-0000-0000-000000000004',
    name: 'Nyakoe Agro-Processing & Pulping Center',
    providerType: 'processor',
    locality: 'Nyakoe',
    county: 'Kisii',
    coordinates: { lat: -0.6382, lng: 34.7355 },
    description: 'Commercial cottage value-addition plant specializing in tomato puree/paste concentration, avocado cold-press oil extraction, and banana flour milling.',
    imageUrl: '/value-addition/puree-processor.jpg',
    imageAlt: 'Nyakoe Agro-Processing stainless steel pulping vats and concentration line',
    contactPhone: '+254 734 556 778',
    contactEmail: 'intake@nyakoeprocessors.co.ke',
    contactWhatsapp: '+254 734 556 778',
    verificationStatus: 'verified',
    verificationEvidence: 'KEBS Food Safety Quality Mark Certified (KS-EAC-58:2018)',
    dataSource: 'provider_confirmed',
    lastUpdated: '2026-10-27T06:15:00Z',
    operatingHours: '07:30 - 18:00 EAT',
    services: [
      {
        id: 'srv-004',
        serviceType: 'processing',
        name: 'Tomato Puree & Sauce Concentration',
        description: 'Mechanical hot-break pulping, seed separation, and 24-Brix vacuum concentration into aseptic food-grade pouches.',
        acceptedCommodities: ['Tomatoes'],
        pricing: {
          amount: 5.0,
          unit: 'kg',
          period: 'batch',
          isQuoteRequired: false,
          description: 'KSh 5.00 per fresh kg (delivers sealed 1kg puree pouches at 45% recovery yield)',
        },
        capacity: {
          available: 2500,
          unit: 'kg',
          minimumOrder: 100,
        },
        turnaroundHours: 24,
        requirements: ['Firm to ripe red fruit (turning/ripe ideal)', 'Less than 10% severe mold cull'],
      },
      {
        id: 'srv-005',
        serviceType: 'processing',
        name: 'Avocado Extra Virgin Cold-Pressing',
        description: 'Decanter cold-press centrifugation producing unrefined extra virgin avocado oil for cosmetic & culinary off-takers.',
        acceptedCommodities: ['Avocados'],
        pricing: {
          amount: 8.0,
          unit: 'kg',
          period: 'batch',
          isQuoteRequired: false,
          description: 'KSh 8.00 per fresh kg (produces ~10-12% oil yield)',
        },
        capacity: {
          available: 3000,
          unit: 'kg',
          minimumOrder: 200,
        },
        turnaroundHours: 48,
        requirements: ['Hass or Fuerte variety', 'Dry matter > 22%'],
      },
    ],
  },
  {
    id: 'p0000005-0000-0000-0000-000000000005',
    name: 'Manga Horticulture Farmers Cooperative',
    providerType: 'cooperative',
    locality: 'Manga',
    county: 'Nyamira',
    coordinates: { lat: -0.6012, lng: 34.8624 },
    description: 'Active smallholder aggregation cooperative pooling vegetables and bananas for institutional hospital and school supply contracts.',
    imageUrl: '/value-addition/coop-aggregation.jpg',
    imageAlt: 'Manga Cooperative farmers offloading produce crates into aggregation shed',
    contactPhone: '+254 720 998 811',
    contactEmail: 'manager@mangafarmers.coop',
    contactWhatsapp: '+254 720 998 811',
    verificationStatus: 'verified',
    verificationEvidence: 'Ministry of Cooperatives Registered Entity (CS/19842)',
    dataSource: 'provider_confirmed',
    lastUpdated: '2026-10-27T08:00:00Z',
    operatingHours: '06:30 - 17:00 EAT',
    services: [
      {
        id: 'srv-006',
        serviceType: 'aggregation',
        name: 'Bulk Produce Pooling & Collective Sale',
        description: 'Cooperative combines member volumes to fulfill bulk tenders at premium commercial prices with consolidated freight.',
        acceptedCommodities: ['Tomatoes', 'Bananas', 'Cabbages', 'Kale', 'Avocados'],
        pricing: {
          amount: 0,
          unit: 'kg',
          period: 'batch',
          isQuoteRequired: false,
          description: '3% cooperative check-off commission deducted upon buyer settlement',
        },
        capacity: {
          available: 5000,
          unit: 'kg',
          minimumOrder: 20,
        },
        turnaroundHours: 12,
        requirements: ['Open to registered and guest smallholders in Kisii/Nyamira'],
      },
    ],
  },
  {
    id: 'p0000006-0000-0000-0000-000000000006',
    name: 'Nyamira Dairy Farmers Co-op Chilling Center',
    providerType: 'dairy_chilling',
    locality: 'Nyamira Town',
    county: 'Nyamira',
    coordinates: { lat: -0.5591, lng: 34.9312 },
    description: 'Stainless steel bulk milk cooling facility with rapid lactometer density testing, alcohol platform tests, and insulated tanker off-take.',
    imageUrl: '/value-addition/dairy-chilling.jpg',
    imageAlt: 'Nyamira Dairy stainless bulk chilling tanks and testing laboratory',
    contactPhone: '+254 712 445 566',
    contactEmail: 'dairy@nyamiracoop.ke',
    contactWhatsapp: '+254 712 445 566',
    verificationStatus: 'verified',
    verificationEvidence: 'Kenya Dairy Board (KDB) Certified Bulking Center',
    dataSource: 'provider_confirmed',
    lastUpdated: '2026-10-27T05:30:00Z',
    operatingHours: '05:00 - 11:00 EAT & 16:00 - 19:30 EAT',
    services: [
      {
        id: 'srv-007',
        serviceType: 'dairy_chilling',
        name: 'Bulk Milk Testing & Chilling (4°C)',
        description: 'Intake quality screening (resazurin, alcohol, lactometer) and rapid cooling from 32°C to 4°C within 90 minutes.',
        acceptedCommodities: ['Cow milk', 'Goat milk'],
        pricing: {
          amount: 1.5,
          unit: 'litre',
          period: 'day',
          isQuoteRequired: false,
          description: 'KSh 1.50 per litre chilling fee or direct off-take purchase at KSh 48.00/litre',
        },
        capacity: {
          available: 4200,
          unit: 'litre',
          minimumOrder: 5,
        },
        turnaroundHours: 1,
        requirements: ['Delivered in stainless steel or aluminum cans within 2.5 hours of milking'],
      },
    ],
  },
  {
    id: 'p0000007-0000-0000-0000-000000000007',
    name: 'Kisii Town Quality Packhouse & Grading Bay',
    providerType: 'packhouse',
    locality: 'Kisii Town',
    county: 'Kisii',
    coordinates: { lat: -0.6755, lng: 34.7688 },
    description: 'Post-harvest grading, sorting, sizing, and certified corrugated box packing for regional supermarket and export off-takers.',
    imageUrl: '/value-addition/packhouse-grading.jpg',
    imageAlt: 'Quality packhouse grading line with electronic sorting tables and scales',
    contactPhone: '+254 728 112 233',
    contactEmail: 'grading@kisiipackhouse.co.ke',
    contactWhatsapp: '+254 728 112 233',
    verificationStatus: 'verified',
    verificationEvidence: 'KEPHIS Phytosanitary Certified Packhouse Facility',
    dataSource: 'provider_confirmed',
    lastUpdated: '2026-10-26T14:00:00Z',
    operatingHours: '07:00 - 19:00 EAT',
    services: [
      {
        id: 'srv-008',
        serviceType: 'grading_sorting',
        name: 'Electronic Sizing & Grade-A Segregation',
        description: 'Rotary belt grading into Grade 1 (Supermarket Premium), Grade 2 (Local Wholesale), and Cull (Processing pulp).',
        acceptedCommodities: ['Tomatoes', 'Avocados', 'Bananas', 'Mangoes', 'Potatoes'],
        pricing: {
          amount: 2.0,
          unit: 'kg',
          period: 'batch',
          isQuoteRequired: false,
          description: 'KSh 2.00 per kg sorted (includes tare certification & sorting manifest)',
        },
        capacity: {
          available: 3500,
          unit: 'kg',
          minimumOrder: 80,
        },
        turnaroundHours: 3,
        requirements: ['Delivered in stackable crates'],
      },
    ],
  },
  {
    id: 'p0000008-0000-0000-0000-000000000008',
    name: 'FreshLink Kisii Commercial Sourcing',
    providerType: 'commercial_buyer',
    locality: 'Kisii Town',
    county: 'Kisii',
    coordinates: { lat: -0.6789, lng: 34.7742 },
    description: 'Direct institutional off-taker supplying regional supermarket chains and institutional kitchens across Western Kenya.',
    imageUrl: '/value-addition/coop-aggregation.jpg',
    imageAlt: 'FreshLink refrigerated distribution trucks and loading bay',
    contactPhone: '+254 733 990 011',
    contactEmail: 'procurement@freshlink.ke',
    contactWhatsapp: '+254 733 990 011',
    verificationStatus: 'verified',
    verificationEvidence: 'Licensed Commercial Wholesale Food Distributor',
    dataSource: 'provider_confirmed',
    lastUpdated: '2026-10-27T08:30:00Z',
    operatingHours: '06:00 - 18:00 EAT',
    services: [
      {
        id: 'srv-009',
        serviceType: 'direct_purchase',
        name: 'Spot Wholesale Off-Take Purchase',
        description: 'Direct bulk purchasing with escrow-secured digital payment upon delivery weighing.',
        acceptedCommodities: ['Tomatoes', 'Avocados', 'Bananas', 'Onions', 'Cabbages'],
        pricing: {
          isQuoteRequired: true,
          description: 'Dynamic spot market price (indicative KSh 45-55/kg for tomatoes based on daily index)',
        },
        capacity: {
          available: 10000,
          unit: 'kg',
          minimumOrder: 150,
        },
        turnaroundHours: 4,
        requirements: ['Weighed on calibrated electronic platform scales', 'Payment cleared via M-Pesa/Escrow'],
      },
    ],
  },
  {
    id: 'p0000009-0000-0000-0000-000000000009',
    name: 'Songa Mobility Fleet',
    providerType: 'transport_provider',
    locality: 'Kisii Transit Depot',
    county: 'Kisii',
    coordinates: { lat: -0.6845, lng: 34.7705 },
    description: 'Fleet of dedicated agricultural vehicles (motorcycle dispatch, Toyota Probox vans, and 3-tonne refrigerated trucks) for farmgate pickup.',
    imageUrl: '/value-addition/cold-storage.jpg',
    imageAlt: 'Songa Mobility agricultural haulage vehicles parked at transit depot',
    contactPhone: '+254 715 678 901',
    contactEmail: 'dispatch@songamobility.co.ke',
    contactWhatsapp: '+254 715 678 901',
    verificationStatus: 'verified',
    verificationEvidence: 'National Transport and Safety Authority (NTSA) Commercial Fleet License',
    dataSource: 'provider_confirmed',
    lastUpdated: '2026-10-27T07:00:00Z',
    operatingHours: '24 Hours On-Call Dispatch',
    services: [
      {
        id: 'srv-010',
        serviceType: 'transport',
        name: 'Farmgate-to-Hub Refrigerated / Shaded Transit',
        description: 'Rapid farmgate collection with digital hanging scale tare check and direct transport to any verified Kisii/Nyamira facility.',
        acceptedCommodities: ['Tomatoes', 'Avocados', 'Bananas', 'Cow milk', 'Vegetables', 'Maize'],
        pricing: {
          amount: 250,
          unit: 'trip',
          period: 'trip',
          isQuoteRequired: false,
          description: 'Base KSh 250 + KSh 25/km for local haulage (up to 1,000 kg)',
        },
        capacity: {
          available: 8,
          unit: 'vehicles',
          minimumOrder: 1,
        },
        turnaroundHours: 1,
        requirements: ['Access road passable for pickup or motorbike', 'Load packaged in crates or cans'],
      },
    ],
  },
];

export function findProvider(id: string): ValueAdditionProvider | undefined {
  const matchId: Record<string, string> = {
    'facility-01': 'f0000001-0000-0000-0000-000000000001',
    'facility-02': 'f0000002-0000-0000-0000-000000000002',
    'facility-03': 'f0000003-0000-0000-0000-000000000003',
  };
  const targetId = matchId[id] || id;
  return regionalProviders.find((p) => p.id === targetId || p.id === id);
}

export function searchProviders(filters: {
  commodity?: string;
  serviceType?: ServiceType;
  county?: 'Kisii' | 'Nyamira';
  maxDistanceKm?: number;
}): ValueAdditionProvider[] {
  return regionalProviders.filter((provider) => {
    if (filters.county && provider.county !== filters.county) {
      return false;
    }

    if (filters.serviceType) {
      const hasService = provider.services.some((s) => s.serviceType === filters.serviceType);
      if (!hasService) return false;
    }

    if (filters.commodity) {
      const target = filters.commodity.toLowerCase();
      const acceptsCommodity = provider.services.some((s) =>
        s.acceptedCommodities.some((c) => {
          const lower = c.toLowerCase();
          return lower.includes(target) || target.includes(lower);
        }),
      );
      if (!acceptsCommodity) return false;
    }

    return true;
  });
}
