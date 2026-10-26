import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

export async function GET(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'facility_operator', 'transport_provider', 'operations_admin'], async ({ actor, supabase }) => {
    const { data, error } = await supabase.from('profiles')
      .select('id, email, full_name, phone, role, requested_role')
      .eq('id', actor.userId).single();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  });
}

export async function PATCH(request: Request) {
  return withAuthenticatedApi(request, ['farmer', 'buyer', 'facility_operator', 'transport_provider'], async ({ actor, supabase }) => {
    const payload = z.object({
      fullName: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().max(40).optional(),
      requestedRole: z.enum(['farmer', 'buyer', 'facility_operator', 'transport_provider']).optional(),
    }).strict().refine((value) => Object.keys(value).length > 0);
    const input = payload.parse(await readJson(request));
    const { data, error } = await supabase.from('profiles').update({
      ...(input.fullName !== undefined ? { full_name: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.requestedRole !== undefined ? { requested_role: input.requestedRole } : {}),
    }).eq('id', actor.userId).select('id, email, full_name, phone, role, requested_role').single();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  });
}
