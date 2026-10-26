import { NextResponse } from 'next/server';
import { requireAuth, toErrorResponse } from '@/lib/backend';
import { getDatabaseAdapter } from '@/lib/database-adapter';
import { getOrchestrator } from '@/lib/orchestrator';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = requireAuth(request, ['farmer', 'operations_admin']);
    const { id } = await params;
    const payload = await request.json().catch(() => ({}));

    const db = getDatabaseAdapter();
    const harvest = await db.getHarvestById(id);

    if (!harvest) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Harvest ${id} not found.` } },
        { status: 404 },
      );
    }

    if (actor.role !== 'operations_admin' && actor.userId !== harvest.farmerId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not own this harvest record.' } },
        { status: 403 },
      );
    }

    const orchestrator = getOrchestrator();
    const assessment = await orchestrator.cropAssessment.assess(harvest, {
      imageUrl: payload?.imageUrl || payload?.photoUrl,
      imageBase64: payload?.imageBase64,
      mimeType: payload?.mimeType,
    });

    return NextResponse.json({ assessment }, { status: 200 });
  } catch (error) {
    const payload = toErrorResponse(error);
    const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 400;
    return NextResponse.json(payload, { status });
  }
}
