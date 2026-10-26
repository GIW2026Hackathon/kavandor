import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();

  if (!payload?.facilityId || !payload?.quantityKg) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'facilityId and quantityKg are required.' } },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      reservation: {
        id: 'reservation-01',
        facilityId: payload.facilityId,
        quantityKg: payload.quantityKg,
        status: 'pending',
      },
    },
    { status: 201 },
  );
}
