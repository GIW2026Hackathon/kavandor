import { NextResponse } from 'next/server';
import { z } from 'zod';

const assessmentSchema = z.object({
  imageUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = assessmentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Assessment request is invalid.' } },
      { status: 400 },
    );
  }

  return NextResponse.json({
    crop: 'Tomato',
    confidence: 0.82,
    observations: [
      { label: 'Colour', detail: 'Mostly red, consistent ripeness visible.', severity: 'medium' },
    ],
    defects: ['Minor surface bruising visible on a few fruits'],
    limitations: ['Visible assessment cannot confirm internal defects or shelf-life.'],
    recommendations: [
      {
        type: 'immediate_sale',
        label: 'Sell immediately',
        description: 'Likely best next action for a ready-to-market lot.',
        estimatedNet: 9300,
        assumptions: ['Demo market price used for planning only'],
        feasible: true,
      },
    ],
    provider: 'demo-vision-model',
    createdAt: new Date().toISOString(),
  });
}
