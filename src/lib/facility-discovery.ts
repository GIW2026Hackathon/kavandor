import type { Facility, FacilityAvailabilitySlot } from '@/types/facility';

export type FacilityCategory =
  | 'cold-storage'
  | 'warehouse'
  | 'silo'
  | 'drying'
  | 'milling'
  | 'processing'
  | 'aggregation'
  | 'grading-packaging'
  | 'other';

export function normalizeCommodity(value: string): string {
  const commodity = value.trim().toLowerCase();
  if (commodity.endsWith('ies')) return `${commodity.slice(0, -3)}y`;
  if (commodity.endsWith('oes')) return commodity.slice(0, -2);
  return commodity.replace(/s$/, '');
}

const categoryLabels: Record<FacilityCategory, string> = {
  'cold-storage': 'Cold storage',
  warehouse: 'Warehouse',
  silo: 'Silo',
  drying: 'Drying',
  milling: 'Milling',
  processing: 'Processing',
  aggregation: 'Aggregation',
  'grading-packaging': 'Grading & packaging',
  other: 'Other facility',
};

export function facilityCategory(facility: Facility): string {
  const type = `${facility.facilityType ?? ''} ${facility.type ?? ''}`.toLowerCase().replaceAll('_', ' ');
  if (type.includes('cold') || type.includes('refrigerat')) return categoryLabels['cold-storage'];
  if (type.includes('warehouse') || type.includes('store') || type.includes('ambient')) return categoryLabels.warehouse;
  if (type.includes('silo')) return categoryLabels.silo;
  if (type.includes('dry')) return categoryLabels.drying;
  if (type.includes('mill')) return categoryLabels.milling;
  if (type.includes('process')) return categoryLabels.processing;
  if (type.includes('aggregat') || type.includes('hub')) return categoryLabels.aggregation;
  if (type.includes('grad') || type.includes('pack')) return categoryLabels['grading-packaging'];
  return categoryLabels.other;
}

export function matchesFacilityCategory(facility: Facility, category: FacilityCategory | 'all'): boolean {
  return category === 'all' || facilityCategory(facility) === categoryLabels[category];
}

export function facilityMatchesOutcome(facility: Facility, outcome: string): boolean {
  const categories: Record<string, FacilityCategory[]> = {
    preserve: ['cold-storage', 'warehouse', 'silo'],
    dry: ['drying'],
    process: ['processing', 'milling'],
    aggregate: ['aggregation'],
    market: ['grading-packaging'],
  };
  return categories[outcome]?.some((category) => matchesFacilityCategory(facility, category)) ?? false;
}

export function facilityBenefit(facility: Facility): { summary: string; limitation: string } {
  const category = facilityCategory(facility);
  if (category === 'Cold storage') {
    return {
      summary: 'Suitable cold handling may slow quality loss and give you more time to find a buyer.',
      limitation: 'Outcome depends on crop-specific conditions, handling, storage duration and buyer demand; no price increase is guaranteed.',
    };
  }
  if (category === 'Drying') {
    return {
      summary: 'Drying may reduce moisture where appropriate, supporting safer storage and market preparation.',
      limitation: 'Confirm the target moisture, expected weight loss, fuel or service fees and crop suitability with the provider.',
    };
  }
  if (category === 'Milling') {
    return {
      summary: 'Milling can convert an eligible crop into flour or another product for a different buyer.',
      limitation: 'Output yield, packaging, milling charges and demand must be confirmed before comparing returns.',
    };
  }
  if (category === 'Processing') {
    return {
      summary: 'Processing can turn raw produce into a different product with potentially different market options.',
      limitation: 'Processing yield, fees, packaging and confirmed demand are not provided, so net returns cannot be estimated.',
    };
  }
  if (category === 'Aggregation') {
    return {
      summary: 'Aggregation can combine produce volumes to meet larger buyer requirements.',
      limitation: 'Buyer access, quality rules, aggregation fees and final prices require confirmation.',
    };
  }
  if (category === 'Grading & packaging') {
    return {
      summary: 'Grading and packaging can prepare produce against buyer specifications.',
      limitation: 'Specifications, reject rates, packaging costs and any market premium must be confirmed.',
    };
  }
  if (category === 'Silo' || category === 'Warehouse') {
    return {
      summary: 'A suitable dry, secure facility can help protect eligible produce while you plan the next sale.',
      limitation: 'Confirm crop requirements, handling conditions, duration, cost and availability with the provider.',
    };
  }
  return {
    summary: 'This provider may offer a post-harvest service for your crop; confirm the exact service and expected outcome.',
    limitation: 'Service details, costs, output and buyer demand are not provided and should not be assumed.',
  };
}

export function formatFacilityPrice(facility: Facility): string {
  if (facility.pricePerUnit === null || !facility.priceUnit) return 'Not provided';
  const price = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 2 }).format(facility.pricePerUnit);
  const period = facility.pricePeriod ? ` / ${facility.pricePeriod}` : '';
  return `KSh ${price} / ${facility.priceUnit}${period}`;
}

export function estimateServiceCost(facility: Facility, quantityKg: number, days: number): number | null {
  if (facility.pricePerUnit === null || facility.priceUnit?.toLowerCase() !== 'kg') return null;
  return facility.pricePerUnit * quantityKg * (facility.pricePeriod?.toLowerCase() === 'day' ? days : 1);
}

export function getServiceConditions(facility: Facility): string {
  const conditions = facility.conditionTargets;
  if (!conditions) return '';
  return Object.entries(conditions)
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${String(value)}`)
    .join(' · ');
}

export function getMatchingSlot(
  facility: Facility,
  startDate: string,
  durationDays: number,
  quantityKg: number,
  harvestDate?: string,
): FacilityAvailabilitySlot | null {
  if (!startDate || (harvestDate && startDate < harvestDate) || !Number.isFinite(durationDays) || durationDays < 1 || quantityKg <= 0) return null;
  const start = new Date(`${startDate}T08:00:00`).getTime();
  const end = start + durationDays * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= Date.now()) return null;
  return facility.availabilitySlots.find((slot) =>
    new Date(slot.windowStart).getTime() <= start &&
    new Date(slot.windowEnd).getTime() >= end &&
    slot.availableCapacityKg >= quantityKg,
  ) ?? null;
}
