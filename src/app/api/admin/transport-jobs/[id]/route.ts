import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['operations_admin'], async ({ supabase }) => {
    const { providerId } = z.object({ providerId: z.string().uuid() }).parse(await readJson(request));
    const { id } = await params;
    const { data, error } = await supabase.rpc('kavandor_assign_transport_provider', {
      p_transport_job_id: id,
      p_provider_id: providerId,
    }).single();
    if (error) throw error;
    return NextResponse.json({ transportJob: data });
  });
}
