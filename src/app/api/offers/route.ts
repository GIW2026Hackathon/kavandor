import { NextResponse } from 'next/server';
import { createOffer, requireAuth, toErrorResponse } from '@/lib/backend';

export async function POST(request: Request) {
  try {
    const actor = requireAuth(request, ['buyer', 'operations_admin']);
    const payload = await request.json();
    const offer = createOffer(payload, actor);
    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    const payload = toErrorResponse(error);
    const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 400;
    return NextResponse.json(payload, { status });
  }
}
