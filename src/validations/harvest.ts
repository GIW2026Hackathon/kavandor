import { z } from 'zod';
import { HARVEST_UNITS } from '../types';

export const harvestUnitSchema = z.enum(HARVEST_UNITS);

export const harvestSchema = z.object({
  crop: z.string().trim().min(2).max(80),
  quantity: z.number().positive().finite(),
  unit: harvestUnitSchema,
  harvestDate: z.string().datetime({ offset: true }),
  location: z.string().trim().min(2).max(150),
  handlingNotes: z.string().max(500).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
});

export const assessmentResponseSchema = z.object({
  crop: z.string().min(2),
  confidence: z.number().min(0).max(1),
  observations: z.array(
    z.object({
      label: z.string(),
      detail: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    }),
  ),
  defects: z.array(z.string()),
  limitations: z.array(z.string()),
  recommendations: z.array(
    z.object({
      type: z.enum(['immediate_sale', 'storage', 'drying', 'aggregation']),
      label: z.string(),
      description: z.string(),
      estimatedNet: z.number(),
      assumptions: z.array(z.string()),
      feasible: z.boolean(),
    }),
  ),
  provider: z.string(),
  createdAt: z.string(),
});

export type HarvestInput = z.infer<typeof harvestSchema>;
export type AssessmentResponse = z.infer<typeof assessmentResponseSchema>;
