import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    listings: [
      {
        id: 'listing-01',
        crop: 'Tomato',
        quantityKg: 180,
        pricePerKg: 45,
        location: 'Kisii',
        source: 'demo_data',
      },
    ],
  });
}
