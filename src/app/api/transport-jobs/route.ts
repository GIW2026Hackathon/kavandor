import { NextResponse } from 'next/server';
import { createTransportJob, requireAuth, toErrorResponse } from '@/lib/backend';

export async function POST(request: Request) {
  try {
    const actor = requireAuth(request, ['farmer', 'operations_admin']);
    const payload = await request.json();
    const job = createTransportJob(payload, actor);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    const payload = toErrorResponse(error);
    const status = error instanceof Error && 'status' in error ? Number((error as { status: number }).status) : 400;
    return NextResponse.json(payload, { status });
  }
}
