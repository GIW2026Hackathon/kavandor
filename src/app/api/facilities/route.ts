import { NextResponse } from 'next/server';
import { listFacilities } from '@/lib/backend';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const facilities = listFacilities({
    commodity: searchParams.get('crop') ?? searchParams.get('commodity') ?? undefined,
    county: searchParams.get('county') ?? undefined,
    limit: Number(searchParams.get('limit') ?? '20'),
  });

  return NextResponse.json({ facilities, source: 'demo_data' });
}
