import { z } from 'zod';

const AvailabilitySlotSchema = z.object({
  id: z.string(),
  capacityKg: z.number(),
  reservedKg: z.number(),
  availableCapacityKg: z.number(),
  windowStart: z.string(),
  windowEnd: z.string(),
});

export const FacilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  county: z.string(),
  location: z.string(),
  type: z.string().nullable(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  facilityType: z.string().nullable(),
  acceptedCommodities: z.array(z.string()),
  storageTypes: z.array(z.string()),
  pricePerUnit: z.number().nullable(),
  priceUnit: z.string().nullable(),
  pricePeriod: z.string().nullable(),
  minimumQuantity: z.number().nullable(),
  capacityUnit: z.string().nullable(),
  conditionTargets: z.record(z.string(), z.unknown()).nullable(),
  verificationStatus: z.string(),
  verifiedAt: z.string().nullable(),
  isDemo: z.boolean(),
  source: z.string(),
  createdAt: z.string(),
  availabilityUpdatedAt: z.string().nullable(),
  availabilitySlots: z.array(AvailabilitySlotSchema),
});

export type Facility = z.infer<typeof FacilitySchema>;
export type FacilityAvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
