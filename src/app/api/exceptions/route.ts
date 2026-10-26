import { NextResponse } from 'next/server';
import { requireAuth, toErrorResponse } from '@/lib/backend';
import { getDatabaseAdapter } from '@/lib/database-adapter';
import { getOrchestrator } from '@/lib/orchestrator';

export async function GET(request: Request) {
  try {
    const actor = requireAuth(request, ['operations_admin', 'facility_operator', 'farmer']);
    const { searchParams } = new URL(request.url);
    const harvestId = searchParams.get('harvestId') || undefined;
    const resolvedParam = searchParams.get('resolved');
    const resolved = resolvedParam !== null ? resolvedParam === 'true' : undefined;

    const db = getDatabaseAdapter();
    const exceptions = await db.getExceptions({ harvestId, resolved });

    return NextResponse.json({ exceptions, actorRole: actor.role });
  } catch (error) {
    const payload = toErrorResponse(error);
    const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 400;
    return NextResponse.json(payload, { status });
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireAuth(request, ['operations_admin', 'facility_operator']);
    const body = await request.json();

    const { exceptionId, actionType, payload } = body;
    if (!exceptionId || !actionType) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing exceptionId or actionType in remediation request.' } },
        { status: 400 },
      );
    }

    const orchestrator = getOrchestrator();
    const remediated = await orchestrator.supervisorExceptions.remediate(
      exceptionId,
      actionType,
      payload || {},
      actor.userId,
    );

    return NextResponse.json({ success: true, exception: remediated });
  } catch (error) {
    const payload = toErrorResponse(error);
    const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 400;
    return NextResponse.json(payload, { status });
  }
}
