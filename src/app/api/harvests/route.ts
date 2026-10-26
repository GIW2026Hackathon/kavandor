import { NextResponse } from 'next/server';
import { createHarvest, getBackendState, requireAuth, toErrorResponse } from '@/lib/backend';

export async function POST(request: Request) {
  try {
    const actor = requireAuth(request, ['farmer', 'operations_admin']);
    const body = await request.json();
    const harvest = createHarvest(body, actor);
    return NextResponse.json({ harvest }, { status: 201 });
  } catch (error) {
    const payload = toErrorResponse(error);
    const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 400;
    return NextResponse.json(payload, { status });
  }
}

export async function GET() {
  return NextResponse.json({ harvests: getBackendState().harvests });
}
