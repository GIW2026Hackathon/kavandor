import { z } from 'zod';

export const quantityUnitSchema = z.enum(['kg', 'crate', 'bucket', 'box']);

export const storageRequestSchema = z.object({
  harvestId: z.string().min(1),
  facilityId: z.string().min(1),
  requestedQuantity: z.number().positive(),
  quantityUnit: quantityUnitSchema,
  requestedStartAt: z.string().datetime(),
  expectedEndAt: z.string().datetime(),
  storageRequirements: z.string().max(1000).optional(),
  transportPreference: z.enum(['self_arranged', 'songa_demo', 'songa_provider']),
}).refine((value) => new Date(value.expectedEndAt) > new Date(value.requestedStartAt), {
  message: 'Expected storage end must be after arrival.',
});

export const transportRequestSchema = z.object({
  harvestId: z.string().min(1),
  storageRequestId: z.string().min(1).optional(),
  pickupLocation: z.string().trim().min(3),
  destinationLocation: z.string().trim().min(3),
  requestedQuantity: z.number().positive(),
  quantityUnit: quantityUnitSchema,
  packageCount: z.number().int().positive().optional(),
  requestedPickupAt: z.string().datetime(),
  loadingInstructions: z.string().max(1000).optional(),
  contactName: z.string().trim().min(2).optional(),
  contactPhone: z.string().trim().min(7).optional(),
});

export type StorageRequestInput = z.infer<typeof storageRequestSchema>;
export type TransportRequestInput = z.infer<typeof transportRequestSchema>;
