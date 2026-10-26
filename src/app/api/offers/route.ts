import { NextResponse } from 'next/server';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';
import { createOffer } from '@/lib/server-backend';

export async function POST(request: Request) {
  return withAuthenticatedApi(request, ['buyer'], async ({ actor, supabase }) => {
    const offer = await createOffer(supabase, actor, await readJson(request));
    return NextResponse.json({ offer }, { status: 201 });
  });
}

export async function GET(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'operations_admin'], async ({ supabase }) => {
    const { data, error } = await supabase.from('offers').select('*')
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ offers: data ?? [] });
  });
}
