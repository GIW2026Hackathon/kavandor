import { NextResponse } from 'next/server';
import { resolveAuthContext } from '@/lib/auth-server';
import {
  BackendError,
  createHarvest,
  getBackendState,
  toErrorResponse,
} from '@/lib/backend';
import { getDatabaseAdapter } from '@/lib/database-adapter';

export async function POST(request: Request) {
  try {
    const actor = await resolveAuthContext(request);
    if (!['farmer', 'operations_admin'].includes(actor.role)) {
      throw new BackendError('FORBIDDEN', 'You do not have permission to perform this action.', 403);
    }

    const body = await request.json();
    const harvest = createHarvest(body, actor);

    const db = getDatabaseAdapter();
    if (db.mode === 'supabase') {
      const persisted = await db.createHarvest({
        farmerId: actor.userId,
        crop: harvest.crop,
        quantity: harvest.quantity,
        unit: harvest.unit,
        harvestDate: harvest.harvestDate,
        location: harvest.location,
        handlingNotes: harvest.handlingNotes,
        photoUrl: harvest.photoUrl,
        status: harvest.status,
      });
      return NextResponse.json({ harvest: persisted }, { status: 201 });
    }

    return NextResponse.json({ harvest }, { status: 201 });
  } catch (error) {
    const payload = toErrorResponse(error);
    const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 400;
    return NextResponse.json(payload, { status });
  }
}

export async function GET() {
  try {
    const db = getDatabaseAdapter();
    const harvests = await db.getHarvests();
    return NextResponse.json({ harvests });
  } catch {
    return NextResponse.json({ harvests: getBackendState().harvests });
  }
}
