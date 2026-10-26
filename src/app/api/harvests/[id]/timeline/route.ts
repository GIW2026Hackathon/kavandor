import { NextResponse } from 'next/server';
import { withAuthenticatedApi } from '@/lib/api-route';
import { getHarvestTimeline } from '@/lib/server-backend';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'facility_operator', 'transport_provider', 'operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    const timeline = await getHarvestTimeline(supabase, id);
    return NextResponse.json({ timeline });
  });
}
