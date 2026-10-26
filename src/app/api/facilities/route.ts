import { NextRequest, NextResponse } from 'next/server';
import { demoFacilities } from '@/demo/storage';

export async function GET(request: NextRequest) {
  const crop = request.nextUrl.searchParams.get('crop')?.toLowerCase();
  const locality = request.nextUrl.searchParams.get('locality')?.toLowerCase();
  const cooling = request.nextUrl.searchParams.get('cooling') === 'true';

  const facilities = demoFacilities.filter((facility) => {
    if (crop && !facility.acceptedCommodities.some((item) => item.toLowerCase().includes(crop))) return false;
    if (locality && !facility.locality.toLowerCase().includes(locality)) return false;
    if (cooling && !facility.storageTypes.includes('cold')) return false;
    return true;
  });

  return NextResponse.json({ facilities, source: 'demo_data' });
}
