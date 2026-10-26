import { NextResponse } from 'next/server';
import { transportRequestSchema } from '@/validations/storage';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = transportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Transport request is invalid.', issues: parsed.error.flatten() } }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    transportRequest: {
      id: 'SONGA-DEMO-001',
      providerName: 'Songa Mobility',
      integrationMode: 'demo',
      status: 'quote_pending',
      source: 'demo_data',
      ...parsed.data,
    },
  }, { status: 201 });
}
