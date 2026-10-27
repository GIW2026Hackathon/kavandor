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

export const clarificationQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  context: z.string(),
  materialImpact: z.string(),
  options: z.array(z.string()),
  answered: z.string().optional(),
});

export const evidenceSchema = z.object({
  visualObservations: z.array(z.string()),
  farmerReportedFacts: z.array(z.string()),
  verifiedProviderInfo: z.array(z.string()),
  estimates: z.array(z.string()),
  unknowns: z.array(z.string()),
});

export const pathwayRecommendationSchema = z.object({
  type: z.enum([
    'immediate_sale',
    'direct_sale',
    'storage',
    'cold_storage',
    'drying',
    'aggregation',
    'processing',
    'grading_sorting',
    'sorting_grading',
    'dairy_chilling',
    'buyer_matching',
  ]),
  label: z.string(),
  description: z.string(),
  estimatedNet: z.number().nullable().optional(),
  grossRevenue: z.number().nullable().optional(),
  totalDeductions: z.number().nullable().optional(),
  yieldRetentionPercent: z.number().optional(),
  suitabilityScore: z.number().min(0).max(100).optional(),
  suitabilityTier: z.enum(['highly_recommended', 'feasible', 'requires_verification', 'infeasible']).optional(),
  assumptions: z.array(z.string()),
  unknowns: z.array(z.string()).optional(),
  feasible: z.boolean(),
  matchedProvider: z
    .object({
      id: z.string(),
      name: z.string(),
      locality: z.string(),
      contactPhone: z.string(),
      serviceName: z.string(),
      pricingSummary: z.string(),
    })
    .optional(),
  actionLabel: z.string().optional(),
  actionHref: z.string().optional(),
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
  recommendations: z.array(pathwayRecommendationSchema),
  clarificationQuestions: z.array(clarificationQuestionSchema).optional(),
  evidence: evidenceSchema.optional(),
  provider: z.string(),
  createdAt: z.string(),
});

export type HarvestInput = z.infer<typeof harvestSchema>;
export type AssessmentResponse = z.infer<typeof assessmentResponseSchema>;
export type PathwayRecommendation = z.infer<typeof pathwayRecommendationSchema>;
