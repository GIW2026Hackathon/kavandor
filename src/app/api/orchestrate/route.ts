import { NextResponse } from 'next/server';
import { requireAuth, toErrorResponse } from '@/lib/backend';
import { getOrchestrator } from '@/lib/orchestrator';

export async function POST(request: Request) {
  try {
    const actor = requireAuth(request, ['farmer', 'operations_admin', 'facility_operator']);
    const body = await request.json();

    if (!body?.harvestId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing harvestId in request body.' } },
        { status: 400 },
      );
    }

    const orchestrator = getOrchestrator();
    const result = await orchestrator.evaluateWorkflow(body.harvestId, actor, {
      photoUrl: body.photoUrl,
      imageBase64: body.imageBase64,
      mimeType: body.mimeType,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[API Orchestrate Error]:', error);
    const payload = toErrorResponse(error);
    const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 400;
    return NextResponse.json(payload, { status });
  }
}
