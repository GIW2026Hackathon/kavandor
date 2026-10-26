import { NextResponse } from 'next/server';
import { withAuthenticatedApi } from '@/lib/api-route';
import { createAssessment } from '@/lib/server-backend';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer', 'operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    const assessment = await createAssessment(supabase, id);
    return NextResponse.json({ assessment });
  });
}
