import { NextResponse } from 'next/server';
import { getMarketplaceListings } from '@/lib/backend';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '10');
  const query = searchParams.get('search') ?? '';
  return NextResponse.json(getMarketplaceListings(query, page, pageSize));
}
