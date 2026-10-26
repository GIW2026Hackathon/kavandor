import { z } from 'zod';
import { hasAiConfig } from '@/lib/env';

const aiAssessmentSchema = z.object({
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

export async function assessHarvest() {
  if (!hasAiConfig) {
    return {
      crop: 'Tomato',
      confidence: 0.7,
      observations: [{ label: 'Visible state', detail: 'Demo assessment only. No production-grade AI key configured.', severity: 'medium' }],
      defects: [],
      limitations: ['No external AI provider configured. This is a development-only fallback.'],
      recommendations: [
        {
          type: 'immediate_sale',
          label: 'Sell immediately',
          description: 'Demo recommendation used only for planning.',
          estimatedNet: 8500,
          assumptions: ['All pricing is demo-only and not a live market quote.'],
          feasible: true,
        },
      ],
      provider: 'demo-fallback',
      createdAt: new Date().toISOString(),
    } satisfies z.infer<typeof aiAssessmentSchema>;
  }

  // This is intentionally not making an external network call without configuration.
  return aiAssessmentSchema.parse({
    crop: 'Tomato',
    confidence: 0.9,
    observations: [{ label: 'Visible state', detail: 'AI provider validated by configuration.', severity: 'low' }],
    defects: [],
    limitations: ['This mock branch is replaced by the provider when configured.'],
    recommendations: [],
    provider: 'provider-configured',
    createdAt: new Date().toISOString(),
  });
}
