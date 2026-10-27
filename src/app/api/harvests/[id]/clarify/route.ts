import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';
import { createAssessment } from '@/lib/server-backend';
import { z } from 'zod';

const clarifyPayloadSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer', 'operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    const body = await readJson(request);
    const { answers } = clarifyPayloadSchema.parse(body);

    const assessment = await createAssessment(supabase, id, answers);

    // Record an activity event that clarification answers were received
    await supabase.from('activity_events').insert({
      harvest_id: id,
      event_type: 'clarification_answered',
      details: {
        answers,
        updated_recommendations_count: (assessment as { recommendations?: unknown[] }).recommendations?.length ?? 0,
      },
    });

    return NextResponse.json({ assessment });
  });
}
