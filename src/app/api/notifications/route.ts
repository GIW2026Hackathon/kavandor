import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

export async function GET(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'facility_operator', 'transport_provider', 'operations_admin'], async ({ actor, supabase }) => {
    const { data, error } = await supabase.from('notifications').select('*')
      .eq('user_id', actor.userId).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ notifications: data ?? [] });
  });
}

export async function PATCH(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'facility_operator', 'transport_provider', 'operations_admin'], async ({ actor, supabase }) => {
    const { ids, read } = z.object({
      ids: z.array(z.string().uuid()).min(1).max(100),
      read: z.boolean(),
    }).parse(await readJson(request));
    const { data, error } = await supabase.from('notifications').update({
      read_at: read ? new Date().toISOString() : null,
    }).eq('user_id', actor.userId).in('id', ids).select('*');
    if (error) throw error;
    return NextResponse.json({ notifications: data ?? [] });
  });
}
