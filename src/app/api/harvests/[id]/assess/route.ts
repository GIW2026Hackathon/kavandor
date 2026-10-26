import { NextResponse } from 'next/server';
import { generateAssessment, requireAuth, toErrorResponse } from '@/lib/backend';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = requireAuth(request, ['farmer', 'operations_admin']);
    const { id } = await params;
    const payload = await request.json();
    const assessment = generateAssessment(id, actor, payload);
    return NextResponse.json({ assessment });
  } catch (error) {
    const payload = toErrorResponse(error);
    const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 400;
    return NextResponse.json(payload, { status });
  }
}
