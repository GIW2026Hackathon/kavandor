import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  return NextResponse.json(
    {
      ok: true,
      inventoryBatch: {
        id: 'batch-01',
        harvestId: payload.harvestId ?? 'demo-harvest-001',
        actualReceivedKg: payload.actualReceivedKg ?? 0,
        status: 'received',
      },
    },
    { status: 201 },
  );
}
