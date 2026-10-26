import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    facilities: [
      {
        id: 'facility-01',
        name: 'Kisii Cold Store Demo',
        type: 'cold_storage',
        location: 'Kisii County',
        capacityKg: 1200,
        pricePerKg: 3.2,
        source: 'demo_data',
      },
    ],
  });
}
