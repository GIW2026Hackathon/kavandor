import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi, withPublicApi } from '@/lib/api-route';
import { createListing, getMarketplaceListings } from '@/lib/server-backend';
import { createSupabasePublicClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  return withPublicApi(async () => {
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const pageSize = Math.min(parsePositiveInt(searchParams.get('pageSize'), 10), 100);
    const supabase = createSupabasePublicClient();
    const result = await getMarketplaceListings(supabase, {
      search: searchParams.get('search') ?? undefined,
      crop: searchParams.get('crop') ?? undefined,
      county: searchParams.get('county') ?? undefined,
      page,
      pageSize,
    });
    return NextResponse.json(result);
  });
}

export async function POST(request: Request) {
  return withAuthenticatedApi(request, ['farmer'], async ({ supabase }) => {
    const listing = await createListing(supabase, await readJson(request));
    return NextResponse.json({ listing }, { status: 201 });
  });
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
