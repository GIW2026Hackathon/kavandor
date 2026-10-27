import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi, withPublicApi } from '@/lib/api-route';
import { getFacility } from '@/lib/server-backend';
import { createSupabasePublicClient } from '@/lib/supabase-server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withPublicApi(async () => {
    const { id } = await params;
    const facility = await getFacility(createSupabasePublicClient(), id);
    if (!facility) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Facility not found.' } }, { status: 404 });
    }
    return NextResponse.json({ facility });
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['facility_operator', 'operations_admin'], async ({ actor, supabase }) => {
    const { id } = await params;
    const input = z.object({
      name: z.string().trim().min(2).max(200).optional(),
      county: z.string().trim().min(2).max(120).optional(),
      location: z.string().trim().min(2).max(300).optional(),
      description: z.string().max(2000).optional(),
      acceptedCommodities: z.array(z.string().trim().min(2).max(80)).max(50).optional(),
      pricePerUnit: z.number().positive().finite().nullable().optional(),
      priceUnit: z.string().trim().max(30).nullable().optional(),
      pricePeriod: z.string().trim().max(30).nullable().optional(),
      verificationStatus: z.enum(['unverified', 'provider_reported', 'verified']).optional(),
    }).strict().refine((value) => Object.keys(value).length > 0).parse(await readJson(request));
    if (input.verificationStatus && actor.role !== 'operations_admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only administrators can change verification status.' } }, { status: 403 });
    }
    const { data, error } = await supabase.from('facilities').update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.county !== undefined ? { county: input.county } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.acceptedCommodities !== undefined ? { accepted_commodities: input.acceptedCommodities } : {}),
      ...(input.pricePerUnit !== undefined ? { price_per_unit: input.pricePerUnit } : {}),
      ...(input.priceUnit !== undefined ? { price_unit: input.priceUnit } : {}),
      ...(input.pricePeriod !== undefined ? { price_period: input.pricePeriod } : {}),
      ...(input.verificationStatus !== undefined ? { verification_status: input.verificationStatus } : {}),
      is_demo: false,
      demo_data: false,
    }).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Facility not found.' } }, { status: 404 });
    return NextResponse.json({ facility: data });
  });
}
