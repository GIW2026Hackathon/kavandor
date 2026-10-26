import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  return NextResponse.json(
    {
      ok: true,
      offer: {
        id: 'offer-01',
        harvestId: payload.harvestId ?? 'demo-harvest-001',
        status: 'pending',
        source: 'demo_data',
      },
    },
    { status: 201 },
  );
}
