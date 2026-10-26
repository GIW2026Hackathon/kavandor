import { z } from 'zod';
import { harvestSchema } from '@/validations/harvest';
import { ApiError } from '@/lib/api-errors';
import { hasAiConfig, serverEnv } from '@/lib/server-env';
import type { AuthContext } from '@/lib/auth-types';
import type { ServerSupabaseClient } from '@/lib/supabase-server';

const createHarvestSchema = harvestSchema.omit({ photoUrl: true }).extend({
  variety: z.string().trim().max(120).optional(),
  availability: z.string().trim().max(120).optional(),
  county: z.string().trim().max(120).optional(),
  idempotencyKey: z.string().uuid().optional(),
}).strict();

const listingSchema = z.object({
  harvestId: z.string().uuid(),
  unitPrice: z.number().positive().finite(),
  source: z.enum(['provider_confirmed', 'provider_reported', 'manually_entered']).default('manually_entered'),
});

export async function createHarvest(supabase: ServerSupabaseClient, input: unknown) {
  const payload = createHarvestSchema.parse(input);
  const location = [payload.location, payload.county].filter(Boolean).join(', ');
  const { data, error } = await supabase.rpc('kavandor_create_harvest', {
    p_crop: payload.crop,
    p_quantity: payload.quantity,
    p_unit: payload.unit,
    p_harvest_date: payload.harvestDate,
    p_location: location,
    p_handling_notes: payload.handlingNotes ?? null,
    p_variety: payload.variety ?? null,
    p_availability: payload.availability ?? null,
    p_idempotency_key: payload.idempotencyKey ?? null,
  }).single();
  if (error) throw error;
  return mapHarvest(data);
}

export async function listHarvests(supabase: ServerSupabaseClient) {
  const { data, error } = await supabase.from('harvests')
    .select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []).map(mapHarvest);
}

export async function getHarvest(supabase: ServerSupabaseClient, harvestId: string) {
  const { data, error } = await supabase.from('harvests').select('*').eq('id', harvestId).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError('NOT_FOUND', 'Harvest not found.', 404);
  return mapHarvest(data);
}

export async function updateHarvest(supabase: ServerSupabaseClient, actor: AuthContext, harvestId: string, input: unknown) {
  const patchSchema = z.object({
    crop: z.string().trim().min(2).max(120).optional(),
    quantity: z.number().positive().finite().optional(),
    unit: z.enum(['kg', 'crate', 'bucket', 'box']).optional(),
    harvestDate: z.string().datetime().optional(),
    location: z.string().trim().min(2).max(240).optional(),
    handlingNotes: z.string().max(2000).nullable().optional(),
  }).strict();
  const patch = patchSchema.parse(input);
  if (Object.keys(patch).length === 0) throw new ApiError('EMPTY_PATCH', 'At least one field must be provided.', 400);
  const { data, error } = await supabase.from('harvests').update({
    ...(patch.crop ? { crop: patch.crop } : {}),
    ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
    ...(patch.unit ? { unit: patch.unit } : {}),
    ...(patch.harvestDate ? { harvest_date: patch.harvestDate } : {}),
    ...(patch.location ? { location: patch.location } : {}),
    ...(patch.handlingNotes !== undefined ? { handling_notes: patch.handlingNotes } : {}),
    updated_at: new Date().toISOString(),
  }).eq('id', harvestId).eq('farmer_id', actor.userId).in('status', ['draft', 'submitted'])
    .select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError('NOT_FOUND_OR_LOCKED', 'Harvest was not found or can no longer be edited.', 404);
  return mapHarvest(data);
}

export async function transitionHarvest(supabase: ServerSupabaseClient, actor: AuthContext, harvestId: string, input: unknown) {
  const { status } = z.object({ status: z.enum(['submitted', 'cancelled']) }).parse(input);
  const { data: harvest, error: readError } = await supabase.from('harvests')
    .select('status').eq('id', harvestId).eq('farmer_id', actor.userId).maybeSingle();
  if (readError) throw readError;
  if (!harvest) throw new ApiError('NOT_FOUND', 'Harvest not found.', 404);
  const allowed: Record<string, string[]> = {
    draft: ['submitted', 'cancelled'],
    submitted: ['cancelled'],
    assessed: ['cancelled'],
    listed: ['cancelled'],
  };
  if (!allowed[harvest.status]?.includes(status)) {
    throw new ApiError('INVALID_TRANSITION', `Cannot transition harvest from ${harvest.status} to ${status}.`, 409);
  }
  const { data, error } = await supabase.from('harvests').update({
    status, updated_at: new Date().toISOString(),
  }).eq('id', harvestId).eq('farmer_id', actor.userId).eq('status', harvest.status).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError('INVALID_TRANSITION', 'Harvest state changed before this request completed.', 409);
  return mapHarvest(data);
}

export async function createListing(supabase: ServerSupabaseClient, input: unknown) {
  const payload = listingSchema.parse(input);
  const { data, error } = await supabase.rpc('kavandor_create_listing', {
    p_harvest_id: payload.harvestId,
    p_unit_price: payload.unitPrice,
    p_source: payload.source,
  }).single();
  if (error) throw error;
  return data;
}

export async function getMarketplaceListings(
  supabase: ServerSupabaseClient,
  params: { search?: string; crop?: string; county?: string; page: number; pageSize: number },
) {
  let query = supabase.from('listings').select('*', { count: 'exact' }).eq('status', 'active');
  const crop = params.crop ? sanitizeFilter(params.crop) : '';
  const county = params.county ? sanitizeFilter(params.county) : '';
  const searchTerm = params.search ? sanitizeFilter(params.search) : '';
  if (crop) query = query.ilike('crop', `%${escapeLike(crop)}%`);
  if (county) query = query.ilike('county', `%${escapeLike(county)}%`);
  if (searchTerm) {
    const search = escapeLike(searchTerm);
    query = query.or(`crop.ilike.%${search}%,county.ilike.%${search}%`);
  }
  const from = (params.page - 1) * params.pageSize;
  const { data, count, error } = await query.order('created_at', { ascending: false })
    .range(from, from + params.pageSize - 1);
  if (error) throw error;
  return { items: data ?? [], page: params.page, pageSize: params.pageSize, total: count ?? 0 };
}

export async function createOffer(supabase: ServerSupabaseClient, actor: AuthContext, input: unknown) {
  const schema = z.object({
    harvestId: z.string().uuid(),
    pricePerKg: z.number().positive().finite(),
    quantityKg: z.number().positive().finite(),
    idempotencyKey: z.string().uuid().optional(),
  });
  const payload = schema.parse(input);
  const { data: buyer, error: buyerError } = await supabase.from('buyers')
    .select('id').eq('profile_id', actor.userId).maybeSingle();
  if (buyerError) throw buyerError;
  if (!buyer) throw new ApiError('BUYER_PROFILE_REQUIRED', 'A buyer profile must be approved before submitting offers.', 403);

  const { data: listing, error: listingError } = await supabase.from('listings')
    .select('harvest_id, quantity_kg').eq('harvest_id', payload.harvestId).eq('status', 'active').maybeSingle();
  if (listingError) throw listingError;
  if (!listing) throw new ApiError('LISTING_NOT_AVAILABLE', 'This listing is no longer available.', 404);
  if (payload.quantityKg > Number(listing.quantity_kg)) {
    throw new ApiError('QUANTITY_EXCEEDS_LISTING', 'Offer quantity exceeds the listed quantity.', 400);
  }

  const { data, error } = await supabase.rpc('kavandor_create_offer', {
    p_harvest_id: payload.harvestId,
    p_price_per_kg: payload.pricePerKg,
    p_quantity_kg: payload.quantityKg,
    p_idempotency_key: payload.idempotencyKey ?? null,
  }).single();
  if (error) throw error;
  return data;
}

export async function transitionOffer(supabase: ServerSupabaseClient, offerId: string, input: unknown) {
  const { status } = z.object({ status: z.enum(['accepted', 'rejected', 'withdrawn', 'expired']) }).parse(input);
  if (status === 'accepted') {
    const { data, error } = await supabase.rpc('kavandor_accept_offer', { p_offer_id: offerId }).single();
    if (error) throw error;
    return data;
  }

  const { data: offer, error: readError } = await supabase.from('offers')
    .select('id, harvest_id, status, expires_at').eq('id', offerId).maybeSingle();
  if (readError) throw readError;
  if (!offer) throw new ApiError('NOT_FOUND', 'Offer not found.', 404);
  if (offer.status !== 'pending') throw new ApiError('INVALID_TRANSITION', 'Only a pending offer can be changed.', 409);

  if (offer.expires_at && new Date(offer.expires_at).getTime() <= Date.now()) {
    const { error } = await supabase.rpc('kavandor_transition_offer', { p_offer_id: offerId, p_next_status: 'expired' });
    if (error) throw error;
    throw new ApiError('OFFER_EXPIRED', 'The offer has expired.', 409);
  }
  const { data, error } = await supabase.rpc('kavandor_transition_offer', {
    p_offer_id: offerId,
    p_next_status: status,
  }).single();
  if (error) throw error;
  return data;
}

export async function reserveFacility(supabase: ServerSupabaseClient, input: unknown) {
  const schema = z.object({
    harvestId: z.string().uuid(),
    facilityId: z.string().uuid(),
    requestedQuantity: z.number().positive().finite().optional(),
    quantityKg: z.number().positive().finite().optional(),
    requestedStartAt: z.string().datetime(),
    expectedEndAt: z.string().datetime(),
    storageRequirements: z.string().max(2000).optional(),
    transportPreference: z.enum(['self_arranged', 'songa_demo', 'songa_provider']).optional(),
    idempotencyKey: z.string().uuid().optional(),
  }).refine((input) => input.requestedQuantity !== undefined || input.quantityKg !== undefined, {
    message: 'requestedQuantity or quantityKg is required',
  });
  const payload = schema.parse(input);
  const { data, error } = await supabase.rpc('kavandor_reserve_capacity', {
    p_harvest_id: payload.harvestId,
    p_facility_id: payload.facilityId,
    p_quantity_kg: payload.requestedQuantity ?? payload.quantityKg,
    p_requested_start: payload.requestedStartAt,
    p_expected_end: payload.expectedEndAt,
    p_handling_notes: payload.storageRequirements ?? null,
    p_transport_preference: payload.transportPreference ?? null,
    p_idempotency_key: payload.idempotencyKey ?? null,
  }).single();
  if (error) throw error;
  return asRecord(data);
}

export async function createTransportJob(supabase: ServerSupabaseClient, input: unknown) {
  const schema = z.object({
    harvestId: z.string().uuid(),
    storageRequestId: z.string().uuid().optional(),
    origin: z.string().trim().min(2).max(300).optional(),
    destination: z.string().trim().min(2).max(300).optional(),
    pickupLocation: z.string().trim().min(2).max(300).optional(),
    destinationLocation: z.string().trim().min(2).max(300).optional(),
    requestedQuantity: z.number().positive().finite().optional(),
    requestedPickupAt: z.string().datetime().optional(),
    loadingInstructions: z.string().max(2000).optional(),
    idempotencyKey: z.string().uuid().optional(),
  });
  const payload = schema.parse(input);
  const origin = payload.origin ?? payload.pickupLocation;
  const destination = payload.destination ?? payload.destinationLocation;
  if (!origin || !destination) throw new ApiError('VALIDATION_ERROR', 'Transport origin and destination are required.', 400);

  const { data, error } = await supabase.rpc('kavandor_create_transport_job', {
    p_harvest_id: payload.harvestId,
    p_storage_request_id: payload.storageRequestId ?? null,
    p_origin: origin,
    p_destination: destination,
    p_requested_quantity: payload.requestedQuantity ?? null,
    p_requested_pickup_at: payload.requestedPickupAt ?? null,
    p_loading_instructions: payload.loadingInstructions ?? null,
    p_idempotency_key: payload.idempotencyKey ?? null,
  }).single();
  if (error) throw error;
  return asRecord(data);
}

export async function transitionTransport(
  supabase: ServerSupabaseClient,
  actor: AuthContext,
  jobId: string,
  input: unknown,
) {
  const schema = z.object({
    status: z.enum(['scheduled', 'in_transit', 'delivered', 'cancelled']),
    actualReceivedKg: z.number().nonnegative().finite().optional(),
    discrepancyNotes: z.string().max(2000).optional(),
    location: z.string().max(300).optional(),
  });
  const payload = schema.parse(input);
  const { data: job, error: readError } = await supabase.from('transport_jobs')
    .select('*').eq('id', jobId).maybeSingle();
  if (readError) throw readError;
  if (!job) throw new ApiError('NOT_FOUND', 'Transport job not found.', 404);
  if (job.farmer_id !== actor.userId && job.provider_id !== actor.userId && actor.role !== 'operations_admin') {
    throw new ApiError('FORBIDDEN', 'You cannot update this transport job.', 403);
  }
  const allowed: Record<string, string[]> = {
    quote_pending: ['scheduled', 'cancelled'],
    scheduled: ['in_transit', 'cancelled'],
    in_transit: ['delivered', 'cancelled'],
  };
  if (!allowed[job.status]?.includes(payload.status)) {
    throw new ApiError('INVALID_TRANSITION', `Cannot transition transport from ${job.status} to ${payload.status}.`, 409);
  }
  if (payload.status === 'delivered' && payload.actualReceivedKg === undefined) {
    throw new ApiError('DELIVERY_WEIGHT_REQUIRED', 'Record the actual delivered quantity to confirm delivery.', 400);
  }
  const { data, error } = await supabase.from('transport_jobs').update({
    status: payload.status,
    actual_received_kg: payload.actualReceivedKg ?? null,
    discrepancy_notes: payload.discrepancyNotes ?? null,
    ...(payload.location ? { last_known_location: payload.location } : {}),
    updated_at: new Date().toISOString(),
  }).eq('id', jobId).eq('status', job.status).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError('INVALID_TRANSITION', 'Transport status changed before this request completed.', 409);
  return data;
}

export async function receiveInventory(supabase: ServerSupabaseClient, input: unknown) {
  const schema = z.object({
    harvestId: z.string().uuid(),
    actualReceivedKg: z.number().nonnegative().finite(),
    facilityId: z.string().uuid(),
    reservationId: z.string().uuid().optional(),
    status: z.literal('received').default('received'),
    discrepancyNotes: z.string().max(2000).optional(),
    idempotencyKey: z.string().uuid().optional(),
  });
  const payload = schema.parse(input);
  const { data, error } = await supabase.rpc('kavandor_record_inventory', {
    p_harvest_id: payload.harvestId,
    p_facility_id: payload.facilityId,
    p_actual_received_kg: payload.actualReceivedKg,
    p_reservation_id: payload.reservationId ?? null,
    p_status: payload.status,
    p_discrepancy_notes: payload.discrepancyNotes ?? null,
    p_idempotency_key: payload.idempotencyKey ?? null,
  }).single();
  if (error) throw error;
  return data;
}

export async function getHarvestTimeline(supabase: ServerSupabaseClient, harvestId: string) {
  const { data, error } = await supabase.from('activity_events').select('*')
    .eq('harvest_id', harvestId).order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function createAssessment(supabase: ServerSupabaseClient, harvestId: string) {
  const harvest = await getHarvest(supabase, harvestId);
  const { data: photo, error: photoError } = await supabase.from('harvest_photos')
    .select('storage_path').eq('harvest_id', harvestId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (photoError) throw photoError;

  const limitations = [
    'Visual assessment cannot verify internal quality, contamination, or exact shelf life.',
  ];
  let assessment: {
    crop: string;
    confidence: number;
    observations: Array<{ label: string; detail: string; severity: 'low' | 'medium' | 'high' }>;
    defects: string[];
    limitations: string[];
    provider: string;
    model: string | null;
    assessment_mode: 'provider' | 'manual_fallback';
  };

  if (!hasAiConfig) {
    assessment = {
      crop: String(harvest.crop),
      confidence: 0,
      observations: [{
        label: 'Assessment unavailable',
        detail: 'No AI provider credentials are configured; visible condition has not been assessed.',
        severity: 'medium',
      }],
      defects: [],
      limitations: [...limitations, 'This is a manual-review fallback, not an AI assessment.'],
      provider: 'manual_fallback',
      model: null,
      assessment_mode: 'manual_fallback',
    };
  } else {
    if (!photo?.storage_path) {
      throw new ApiError('PHOTO_REQUIRED', 'Upload a harvest photo before requesting an AI assessment.', 400);
    }
    const { data: signed, error: signedError } = await supabase.storage
      .from('harvest-photos').createSignedUrl(photo.storage_path, 300);
    if (signedError) throw signedError;

    const outputSchema = z.object({
      crop: z.string().min(2),
      confidence: z.number().min(0).max(1),
      observations: z.array(z.object({
        label: z.string().min(1),
        detail: z.string().min(1),
        severity: z.enum(['low', 'medium', 'high']),
      })).max(20),
      defects: z.array(z.string().min(1)).max(30),
      limitations: z.array(z.string().min(1)).max(20),
    });
    let response: Response;
    try {
      response = await fetch(serverEnv.AI_PROVIDER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serverEnv.AI_PROVIDER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          model: serverEnv.AI_PROVIDER_MODEL,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'Assess only visible produce condition in the provided image. Do not infer internal quality, contamination, or shelf life. Return a JSON object with crop, confidence (0 to 1), observations [{label,detail,severity}], defects [string], limitations [string]. Do not return recommendations or prices.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Recorded crop: ${harvest.crop}. Treat this as a clue, not verified ground truth.` },
                { type: 'image_url', image_url: { url: signed.signedUrl } },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      console.error('AI provider request failed:', error instanceof Error ? error.name : 'unknown error');
      throw new ApiError('ASSESSMENT_PROVIDER_UNAVAILABLE', 'The assessment provider could not be reached.', 502);
    }
    if (!response.ok) {
      console.error('AI provider returned an error status:', response.status);
      throw new ApiError('ASSESSMENT_PROVIDER_ERROR', 'The assessment provider could not complete the assessment.', 502);
    }
    let providerBody: unknown;
    try {
      providerBody = await response.json();
    } catch {
      throw new ApiError('INVALID_PROVIDER_RESPONSE', 'The assessment provider returned invalid JSON.', 502);
    }
    const providerResponseSchema = z.object({
      choices: z.array(z.object({
        message: z.object({ content: z.string() }),
      })).min(1),
    });
    const providerResponse = providerResponseSchema.safeParse(providerBody);
    if (!providerResponse.success) {
      throw new ApiError('INVALID_PROVIDER_RESPONSE', 'The assessment provider returned an invalid response.', 502);
    }
    const rawContent = providerResponse.data.choices[0].message.content;
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(rawContent);
    } catch {
      throw new ApiError('INVALID_PROVIDER_RESPONSE', 'The assessment provider returned invalid structured data.', 502);
    }
    const validatedResult = outputSchema.safeParse(parsedContent);
    if (!validatedResult.success) {
      throw new ApiError('INVALID_PROVIDER_RESPONSE', 'The assessment provider returned invalid assessment fields.', 502);
    }
    const validated = validatedResult.data;
    assessment = {
      ...validated,
      limitations: [...new Set([...validated.limitations, ...limitations])],
      provider: 'openai_compatible',
      model: serverEnv.AI_PROVIDER_MODEL,
      assessment_mode: 'provider',
    };
  }

  const { data, error } = await supabase.rpc('kavandor_save_assessment', {
    p_harvest_id: harvestId,
    p_crop: assessment.crop,
    p_confidence: assessment.confidence,
    p_observations: assessment.observations,
    p_defects: assessment.defects,
    p_limitations: assessment.limitations,
    p_provider: assessment.provider,
    p_mode: assessment.assessment_mode,
    p_model: assessment.model,
  }).single();
  if (error) throw error;
  return data;
}

export async function listFacilities(
  supabase: ServerSupabaseClient,
  params: { commodity?: string; county?: string; limit: number },
) {
  let query = supabase.from('facilities')
    .select('id, name, county, location, type, facility_type, description, accepted_commodities, storage_types, price_per_unit, price_unit, price_period, minimum_quantity, verification_status, is_demo')
    .limit(params.limit);
  if (params.county) query = query.ilike('county', `%${escapeLike(sanitizeFilter(params.county))}%`);
  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).filter((facility) =>
    !params.commodity ||
    (Array.isArray(facility.accepted_commodities) && facility.accepted_commodities
      .some((commodity: unknown) => typeof commodity === 'string' &&
        commodity.toLowerCase() === params.commodity?.toLowerCase())),
  );
}

export async function getRecommendations(supabase: ServerSupabaseClient, harvestId: string) {
  const harvest = await getHarvest(supabase, harvestId);
  const facilities = await listFacilities(supabase, { commodity: harvest.crop, limit: 100 });
  const { data: slots, error } = await supabase.from('capacity_slots')
    .select('id, facility_id, capacity_kg, reserved_kg, window_start, window_end')
    .gte('window_end', new Date().toISOString())
    .order('window_start', { ascending: true })
    .limit(300);
  if (error) throw error;

  const options = facilities.flatMap((facility) => {
    const facilitySlots = (slots ?? []).filter((slot) => slot.facility_id === facility.id);
    const candidates = facilitySlots.length > 0 ? facilitySlots : [null];
    return candidates.map((slot) => {
      const availableCapacityKg = slot
        ? Math.max(0, Number(slot.capacity_kg) - Number(slot.reserved_kg))
        : 0;
      return {
        type: 'storage',
        label: facility.name,
        description: facility.location,
        estimatedNet: null,
        currency: 'KES',
        assumptions: [
          'No current buyer price and complete route-cost inputs are configured; net proceeds are not estimated.',
          'Facility capacity reflects configured slots and must be reconfirmed when reserving.',
        ],
        feasible: Boolean(slot) && harvest.unit === 'kg' && availableCapacityKg >= harvest.quantity,
        facilityId: facility.id,
        capacitySlotId: slot?.id ?? null,
        availableCapacityKg,
        windowStart: slot?.window_start ?? null,
        windowEnd: slot?.window_end ?? null,
        source: facility.is_demo ? 'demo_data' : facility.verification_status,
      };
    });
  });
  return { harvestId, options, pricingAvailable: false };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('INVALID_DATABASE_RESPONSE', 'The database returned an invalid record.', 502);
  }
  return value as Record<string, unknown>;
}

function mapHarvest(value: unknown): {
  id: string;
  farmerId: string;
  crop: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  location: string;
  handlingNotes: string | null;
  photoPath: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
} {
  const row = asRecord(value);
  return {
    id: requiredString(row, 'id'),
    farmerId: requiredString(row, 'farmer_id'),
    crop: requiredString(row, 'crop'),
    quantity: Number(row.quantity),
    unit: requiredString(row, 'unit'),
    harvestDate: requiredString(row, 'harvest_date'),
    location: requiredString(row, 'location'),
    handlingNotes: nullableString(row, 'handling_notes'),
    photoPath: nullableString(row, 'photo_path'),
    status: requiredString(row, 'status'),
    createdAt: requiredString(row, 'created_at'),
    updatedAt: requiredString(row, 'updated_at'),
  };
}

function requiredString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') {
    throw new ApiError('INVALID_DATABASE_RESPONSE', `The database returned an invalid ${key} field.`, 502);
  }
  return value;
}

function nullableString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new ApiError('INVALID_DATABASE_RESPONSE', `The database returned an invalid ${key} field.`, 502);
  }
  return value;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function sanitizeFilter(value: string) {
  return value.replace(/[^a-zA-Z0-9 -]/g, ' ').trim().replace(/\s+/g, ' ');
}
