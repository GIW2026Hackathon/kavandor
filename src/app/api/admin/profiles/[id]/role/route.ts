import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['operations_admin'], async ({ supabase }) => {
    const { id } = await params;
    const input = z.object({
      role: z.enum(['farmer', 'buyer', 'facility_operator', 'transport_provider']),
      companyName: z.string().trim().min(2).max(200).optional(),
      location: z.string().trim().min(2).max(200).optional(),
    }).parse(await readJson(request));
    const { data, error } = await supabase.rpc('kavandor_admin_assign_role', {
      p_profile_id: id,
      p_role: input.role,
      p_company_name: input.companyName ?? null,
      p_location: input.location ?? null,
    }).single();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  });
}
