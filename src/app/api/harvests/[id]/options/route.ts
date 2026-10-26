import { NextResponse } from 'next/server';
import { withAuthenticatedApi } from '@/lib/api-route';
import { getRecommendations } from '@/lib/server-backend';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer', 'operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    return NextResponse.json(await getRecommendations(supabase, id));
  });
}
