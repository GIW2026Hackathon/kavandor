import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';
import { createTransportJob } from '@/lib/server-backend';

export async function POST(request: Request) {
  return withAuthenticatedApi(request, ['farmer'], async ({ supabase, actor }) => {
    const job = await createTransportJob(supabase, await readJson(request), actor);
    return NextResponse.json({ transportRequest: job }, { status: 201 });
  });
}

export async function GET(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'transport_provider', 'operations_admin'], async ({ supabase }) => {
    const { data, error } = await supabase.from('transport_jobs').select('*')
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ transportJobs: data ?? [] });
  });
}
