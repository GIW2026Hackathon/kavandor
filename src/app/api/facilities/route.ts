import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api-errors';
import { withAuthenticatedApi, withPublicApi } from '@/lib/api-route';
import { listFacilities } from '@/lib/server-backend';
import { createSupabasePublicClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  return withPublicApi(async () => {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get('limit') ?? '20');
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
    const supabase = createSupabasePublicClient();
    const facilities = await listFacilities(supabase, {
      commodity: searchParams.get('crop') ?? searchParams.get('commodity') ?? undefined,
      county: searchParams.get('county') ?? undefined,
      limit,
    });
    return NextResponse.json({ facilities, source: 'database' });
  });
}

export async function POST(request: Request) {
  return withAuthenticatedApi(request, ['operations_admin'], async ({ supabase }) => {
    const input = z.object({
      name: z.string().trim().min(2).max(200),
      county: z.string().trim().min(2).max(120),
      location: z.string().trim().min(2).max(300),
      type: z.string().trim().min(2).max(80),
      operatorId: z.string().uuid(),
      facilityType: z.string().trim().min(2).max(80),
      acceptedCommodities: z.array(z.string().trim().min(2).max(80)).max(50),
      pricePerUnit: z.number().positive().finite().optional(),
      priceUnit: z.string().trim().max(30).optional(),
      pricePeriod: z.string().trim().max(30).optional(),
      minimumQuantity: z.number().positive().finite().optional(),
      capacityUnit: z.string().trim().max(30).optional(),
    }).parse(await readJson(request));
    const { data: operator, error: operatorError } = await supabase.from('profiles')
      .select('id, role').eq('id', input.operatorId).maybeSingle();
    if (operatorError) throw operatorError;
    if (operator?.role !== 'facility_operator') {
      return NextResponse.json({ error: { code: 'INVALID_OPERATOR', message: 'The assigned profile is not a facility operator.' } }, { status: 400 });
    }
    const { data, error } = await supabase.from('facilities').insert({
      name: input.name,
      county: input.county,
      location: input.location,
      type: input.type,
      operator_id: input.operatorId,
      facility_type: input.facilityType,
      accepted_commodities: input.acceptedCommodities,
      price_per_unit: input.pricePerUnit ?? null,
      price_unit: input.priceUnit ?? null,
      price_period: input.pricePeriod ?? null,
      minimum_quantity: input.minimumQuantity ?? null,
      capacity_unit: input.capacityUnit ?? 'kg',
      verification_status: 'unverified',
      is_demo: false,
      demo_data: false,
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ facility: data }, { status: 201 });
  });
}
