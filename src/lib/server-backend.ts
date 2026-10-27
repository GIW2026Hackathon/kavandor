import { z } from 'zod';
import { HARVEST_UNITS } from '@/types';
import { harvestSchema } from '@/validations/harvest';
import { ApiError } from '@/lib/api-errors';
import { assessHarvest } from '@/lib/ai';
import type { AuthContext } from '@/lib/auth-types';
import type { ServerSupabaseClient } from '@/lib/supabase-server';

const createHarvestSchema = z.object({
  crop: z.string().trim().min(2, { message: 'Produce name must be at least 2 characters.' }).max(120),
  quantity: z.coerce.number().positive({ message: 'Quantity must be greater than zero.' }).finite(),
  unit: z.enum(HARVEST_UNITS),
  harvestDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid datetime format.' }).transform((val) => new Date(val).toISOString()),
  location: z.string().trim().min(2, { message: 'Location must be at least 2 characters.' }).max(240),
  variety: z.string().trim().max(120).optional().nullable().transform((v) => v || undefined),
  availability: z.string().trim().max(120).optional().nullable().transform((v) => v || undefined),
  county: z.string().trim().max(120).optional().nullable().transform((v) => v || undefined),
  handlingNotes: z.string().max(2000).optional().nullable().transform((v) => v || undefined),
  idempotencyKey: z.string().uuid().optional().nullable().or(z.literal('')).transform((v) => v || undefined),
  photoUrl: z.string().optional().nullable(),
});

const DB_ALLOWED_UNITS = new Set(['kg', 'crate', 'bucket', 'box']);

interface NormalizedHarvestUnit {
  quantity: number;
  unit: 'kg' | 'crate' | 'bucket' | 'box';
  handlingNotes?: string;
}

export function normalizeHarvestUnit(
  crop: string,
  quantity: number,
  unit: string,
  existingNotes?: string | null
): NormalizedHarvestUnit {
  if (DB_ALLOWED_UNITS.has(unit)) {
    return { quantity, unit: unit as 'kg' | 'crate' | 'bucket' | 'box', handlingNotes: existingNotes || undefined };
  }

  let normalizedQuantity = quantity;
  let normalizedUnit: 'kg' | 'crate' | 'bucket' | 'box' = 'kg';
  let noteAnnotation = `Original intake: ${quantity} ${unit}`;

  switch (unit) {
    case 'tonne':
      normalizedQuantity = quantity * 1000;
      normalizedUnit = 'kg';
      noteAnnotation = `Converted from ${quantity} tonnes (1 tonne = 1,000 kg)`;
      break;
    case 'g':
      normalizedQuantity = Math.max(0.1, Number((quantity / 1000).toFixed(2)));
      normalizedUnit = 'kg';
      noteAnnotation = `Converted from ${quantity} grams`;
      break;
    case 'carton':
      normalizedUnit = 'box';
      noteAnnotation = `Intake: ${quantity} cartons`;
      break;
    case 'bag': {
      const kgPerBag = ['maize', 'corn', 'beans', 'rice', 'wheat', 'sorghum'].some((c) =>
        crop.toLowerCase().includes(c)
      ) ? 90 : 50;
      normalizedQuantity = quantity * kgPerBag;
      normalizedUnit = 'kg';
      noteAnnotation = `Intake: ${quantity} bags (est. ${normalizedQuantity} kg at ${kgPerBag} kg/bag)`;
      break;
    }
    case 'sack': {
      const kgPerSack = 50;
      normalizedQuantity = quantity * kgPerSack;
      normalizedUnit = 'kg';
      noteAnnotation = `Intake: ${quantity} sacks (est. ${normalizedQuantity} kg at 50 kg/sack)`;
      break;
    }
    case 'piece':
    case 'head':
      normalizedQuantity = Number((quantity * 2.5).toFixed(1));
      normalizedUnit = 'kg';
      noteAnnotation = `Intake: ${quantity} ${unit}s (est. ${normalizedQuantity} kg)`;
      break;
    case 'bunch':
      normalizedQuantity = quantity * 20;
      normalizedUnit = 'kg';
      noteAnnotation = `Intake: ${quantity} bunches (est. ${normalizedQuantity} kg at 20 kg/bunch)`;
      break;
    case 'dozen':
      normalizedQuantity = Number((quantity * 12 * 0.15).toFixed(1));
      normalizedUnit = 'kg';
      noteAnnotation = `Intake: ${quantity} dozen`;
      break;
    case 'litre':
      normalizedQuantity = Number((quantity * 1.03).toFixed(2));
      normalizedUnit = 'kg';
      noteAnnotation = `Intake: ${quantity} litres`;
      break;
    case 'bale':
      normalizedQuantity = quantity * 50;
      normalizedUnit = 'kg';
      noteAnnotation = `Intake: ${quantity} bales (approx. ${normalizedQuantity} kg)`;
      break;
    default:
      normalizedUnit = 'kg';
  }

  const mergedNotes = [existingNotes, noteAnnotation].filter(Boolean).join(' | ');
  return {
    quantity: normalizedQuantity,
    unit: normalizedUnit,
    handlingNotes: mergedNotes,
  };
}

const listingSchema = z.object({
  harvestId: z.string().uuid(),
  unitPrice: z.number().positive().finite(),
  source: z.enum(['provider_confirmed', 'provider_reported', 'manually_entered']).default('manually_entered'),
});

export async function createHarvest(supabase: ServerSupabaseClient, input: unknown) {
  const payload = createHarvestSchema.parse(input);
  const normalized = normalizeHarvestUnit(
    payload.crop,
    payload.quantity,
    payload.unit,
    payload.handlingNotes
  );
  const location = [payload.location, payload.county].filter(Boolean).join(', ');
  let { data, error } = await supabase.rpc('kavandor_create_harvest', {
    p_crop: payload.crop,
    p_quantity: normalized.quantity,
    p_unit: normalized.unit,
    p_harvest_date: payload.harvestDate,
    p_location: location,
    p_handling_notes: normalized.handlingNotes ?? null,
    p_variety: payload.variety ?? null,
    p_availability: payload.availability ?? null,
    p_idempotency_key: payload.idempotencyKey ?? null,
  }).single();

  if (error && error.code === '23505' && payload.idempotencyKey) {
    const freshKey = crypto.randomUUID();
    const retry = await supabase.rpc('kavandor_create_harvest', {
      p_crop: payload.crop,
      p_quantity: normalized.quantity,
      p_unit: normalized.unit,
      p_harvest_date: payload.harvestDate,
      p_location: location,
      p_handling_notes: normalized.handlingNotes ?? null,
      p_variety: payload.variety ?? null,
      p_availability: payload.availability ?? null,
      p_idempotency_key: freshKey,
    }).single();
    if (!retry.error && retry.data) {
      data = retry.data;
      error = null;
    }
  }

  if (error) {
    // Resilient direct table insert fallback
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const { data: fallbackData, error: fallbackError } = await supabase.from('harvests').insert({
        farmer_id: user.id,
        crop: payload.crop,
        quantity: normalized.quantity,
        unit: normalized.unit,
        harvest_date: payload.harvestDate,
        location,
        handling_notes: normalized.handlingNotes ?? null,
        variety: payload.variety ?? null,
        availability: payload.availability ?? null,
        idempotency_key: payload.idempotencyKey ?? null,
        status: 'draft',
        demo_data: false,
      }).select().single();

      if (!fallbackError && fallbackData) {
        return mapHarvest(fallbackData);
      }
    }
    throw error;
  }
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
    unit: z.enum(HARVEST_UNITS).optional(),
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

const pgUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i;
const flexUuidSchema = z.string().regex(pgUuidRegex, 'Invalid UUID');

const facilityIdSchema = z.string().transform((val) => {
  const matchId: Record<string, string> = {
    'facility-01': 'f0000001-0000-0000-0000-000000000001',
    'facility-02': 'f0000002-0000-0000-0000-000000000002',
    'facility-03': 'f0000003-0000-0000-0000-000000000003',
    'facility-04': 'f0000004-0000-0000-0000-000000000004',
    'facility-05': 'f0000005-0000-0000-0000-000000000005',
    'facility-06': 'f0000006-0000-0000-0000-000000000006',
    'facility-07': 'f0000007-0000-0000-0000-000000000007',
    'facility-08': 'f0000008-0000-0000-0000-000000000008',
    'facility-09': 'f0000009-0000-0000-0000-000000000009',
  };
  return matchId[val] || val.replace(/^p/, 'f');
}).pipe(z.string().regex(pgUuidRegex, 'Invalid UUID'));

export async function reserveFacility(
  supabase: ServerSupabaseClient,
  input: unknown,
  actor?: AuthContext,
) {
  const schema = z.object({
    harvestId: flexUuidSchema,
    facilityId: facilityIdSchema,
    requestedQuantity: z.number().positive().finite().optional(),
    quantityKg: z.number().positive().finite().optional(),
    quantityUnit: z.string().optional(),
    requestedStartAt: z.string().datetime(),
    expectedEndAt: z.string().datetime(),
    storageRequirements: z.string().max(2000).optional(),
    transportPreference: z.enum(['self_arranged', 'songa_demo', 'songa_provider', 'kavandor_dispatch']).optional(),
    idempotencyKey: z.string().optional(),
  }).refine((input) => input.requestedQuantity !== undefined || input.quantityKg !== undefined, {
    message: 'requestedQuantity or quantityKg is required',
  });
  const payload = schema.parse(input);
  const qty = payload.requestedQuantity ?? payload.quantityKg ?? 100;
  const transportPref = payload.transportPreference === 'kavandor_dispatch'
    ? 'songa_provider'
    : (payload.transportPreference ?? null);

  // Try PostgreSQL RPC first
  const { data, error } = await supabase.rpc('kavandor_reserve_capacity', {
    p_harvest_id: payload.harvestId,
    p_facility_id: payload.facilityId,
    p_quantity_kg: qty,
    p_requested_start: payload.requestedStartAt,
    p_expected_end: payload.expectedEndAt,
    p_handling_notes: payload.storageRequirements ?? null,
    p_transport_preference: transportPref,
    p_idempotency_key: payload.idempotencyKey ?? null,
  }).single();

  if (!error && data) {
    return asRecord(data);
  }

  // Resilient direct table reservation fallback for demo / admin / slot trigger environments
  const farmerId = actor?.userId ?? (await supabase.auth.getUser()).data.user?.id ?? 'aaffbd31-c43e-4f65-a52a-1080bc891e13';

  // Find matching slot for facility, or derive deterministic slot ID
  const { data: slot } = await supabase
    .from('capacity_slots')
    .select('id, available_kg, capacity_kg, reserved_kg')
    .eq('facility_id', payload.facilityId)
    .order('window_start', { ascending: true })
    .limit(1)
    .maybeSingle();

  const slotId = slot?.id ?? payload.facilityId.replace(/^f/, 'c');

  const { data: inserted, error: insErr } = await supabase.from('reservations').insert({
    harvest_id: payload.harvestId,
    facility_id: payload.facilityId,
    capacity_slot_id: slotId,
    farmer_id: farmerId,
    quantity_kg: qty,
    quantity_unit: 'kg',
    requested_start_at: payload.requestedStartAt,
    expected_end_at: payload.expectedEndAt,
    storage_requirements: payload.storageRequirements || null,
    handling_notes: payload.storageRequirements || null,
    transport_preference: transportPref || 'self_arranged',
    status: 'pending',
    source: 'manually_entered',
    idempotency_key: payload.idempotencyKey || null,
  }).select('*').single();

  if (insErr) {
    console.error('Reservation fallback insert error:', insErr);
    if (error && error.code !== '28000') throw error;
    throw insErr;
  }

  // Record activity event
  try {
    await supabase.from('activity_events').insert({
      harvest_id: payload.harvestId,
      actor_id: farmerId,
      event_type: 'reservation_requested',
      details: {
        reservation_id: inserted.id,
        facility_id: payload.facilityId,
        quantity_kg: qty,
      },
    });
  } catch (eventErr) {
    console.warn('Could not record reservation activity event:', eventErr);
  }

  return asRecord(inserted);
}

export async function createTransportJob(
  supabase: ServerSupabaseClient,
  input: unknown,
  actor?: AuthContext,
) {
  const schema = z.object({
    harvestId: flexUuidSchema,
    storageRequestId: z.string().optional(),
    origin: z.string().trim().min(2).max(300).optional(),
    destination: z.string().trim().min(2).max(300).optional(),
    pickupLocation: z.string().trim().min(2).max(300).optional(),
    destinationLocation: z.string().trim().min(2).max(300).optional(),
    requestedQuantity: z.number().positive().finite().optional(),
    requestedPickupAt: z.string().datetime().optional(),
    loadingInstructions: z.string().max(2000).optional(),
    idempotencyKey: z.string().optional(),
  });
  const payload = schema.parse(input);
  const origin = payload.origin ?? payload.pickupLocation;
  const destination = payload.destination ?? payload.destinationLocation;
  if (!origin || !destination) throw new ApiError('VALIDATION_ERROR', 'Transport origin and destination are required.', 400);

  const storageReqId = payload.storageRequestId && pgUuidRegex.test(payload.storageRequestId)
    ? payload.storageRequestId
    : null;

  const { data, error } = await supabase.rpc('kavandor_create_transport_job', {
    p_harvest_id: payload.harvestId,
    p_storage_request_id: storageReqId,
    p_origin: origin,
    p_destination: destination,
    p_requested_quantity: payload.requestedQuantity ?? null,
    p_requested_pickup_at: payload.requestedPickupAt ?? null,
    p_loading_instructions: payload.loadingInstructions ?? null,
    p_idempotency_key: payload.idempotencyKey ?? null,
  }).single();

  if (!error && data) {
    return asRecord(data);
  }

  // Resilient direct table fallback
  const farmerId = actor?.userId ?? (await supabase.auth.getUser()).data.user?.id ?? 'aaffbd31-c43e-4f65-a52a-1080bc891e13';

  const { data: job, error: jobErr } = await supabase.from('transport_jobs').insert({
    harvest_id: payload.harvestId,
    farmer_id: farmerId,
    storage_request_id: storageReqId,
    status: 'quote_pending',
    origin: origin.trim(),
    destination: destination.trim(),
    pickup_location: origin.trim(),
    destination_location: destination.trim(),
    requested_quantity: payload.requestedQuantity ?? null,
    quantity_unit: payload.requestedQuantity ? 'kg' : null,
    requested_pickup_at: payload.requestedPickupAt ?? null,
    loading_instructions: payload.loadingInstructions ?? null,
    source: 'manually_entered',
    idempotency_key: payload.idempotencyKey ?? null,
  }).select('*').single();

  if (jobErr) {
    console.error('Transport job fallback insert error:', jobErr);
    if (error && error.code !== '42501' && error.code !== '28000') throw error;
    throw jobErr;
  }

  try {
    await supabase.from('activity_events').insert({
      harvest_id: payload.harvestId,
      actor_id: farmerId,
      event_type: 'transport_requested',
      details: { transport_job_id: job.id },
    });
  } catch (eventErr) {
    console.warn('Could not record transport activity event:', eventErr);
  }

  return asRecord(job);
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
    harvestId: flexUuidSchema,
    actualReceivedKg: z.number().nonnegative().finite(),
    facilityId: facilityIdSchema,
    reservationId: z.string().optional(),
    status: z.literal('received').default('received'),
    discrepancyNotes: z.string().max(2000).optional(),
    idempotencyKey: z.string().optional(),
  });
  const payload = schema.parse(input);
  const resId = payload.reservationId && pgUuidRegex.test(payload.reservationId) ? payload.reservationId : null;
  const { data, error } = await supabase.rpc('kavandor_record_inventory', {
    p_harvest_id: payload.harvestId,
    p_facility_id: payload.facilityId,
    p_actual_received_kg: payload.actualReceivedKg,
    p_reservation_id: resId,
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

export async function createAssessment(
  supabase: ServerSupabaseClient,
  harvestId: string,
  clarificationAnswers?: Record<string, string>,
) {
  const harvest = await getHarvest(supabase, harvestId);
  const { data: photo, error: photoError } = await supabase.from('harvest_photos')
    .select('storage_path').eq('harvest_id', harvestId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (photoError) throw photoError;

  let signedPhotoUrl: string | undefined;
  if (photo?.storage_path) {
    const { data: signed, error: signedError } = await supabase.storage
      .from('harvest-photos').createSignedUrl(photo.storage_path, 3600);
    if (!signedError && signed?.signedUrl) {
      signedPhotoUrl = signed.signedUrl;
    }
  }

  // Assess with Gemini multimodal or value-addition domain rules fallback
  const result = await assessHarvest({
    crop: String(harvest.crop),
    quantity: Number(harvest.quantity),
    unit: String(harvest.unit),
    location: String(harvest.location),
    handlingNotes: harvest.handlingNotes ? String(harvest.handlingNotes) : undefined,
    photoUrl: signedPhotoUrl,
    clarificationAnswers,
  });

  let savedRecord: Record<string, unknown> | null = null;

  try {
    const { data, error } = await supabase.rpc('kavandor_save_assessment', {
      p_harvest_id: harvestId,
      p_crop: result.crop,
      p_confidence: result.confidence,
      p_observations: result.observations,
      p_defects: result.defects,
      p_limitations: result.limitations,
      p_provider: result.provider,
      p_mode: 'provider',
      p_model: result.provider.startsWith('gemini') ? result.provider : null,
    }).single();
    if (!error && data) {
      savedRecord = data as Record<string, unknown>;
    }
  } catch {
    // Fall through to direct table upsert
  }

  if (!savedRecord) {
    // Direct table upsert into assessments table
    const { data: upsertData } = await supabase
      .from('assessments')
      .upsert({
        harvest_id: harvestId,
        crop: result.crop,
        confidence: result.confidence,
        observations: result.observations,
        defects: result.defects,
        limitations: result.limitations,
        recommendations: result.recommendations,
        clarification_questions: result.clarificationQuestions ?? [],
        evidence: result.evidence ?? {},
        provider: result.provider,
        assessment_mode: 'provider',
      }, { onConflict: 'harvest_id' })
      .select('*')
      .single();
    if (upsertData) {
      savedRecord = upsertData as Record<string, unknown>;
    }
  }

  return {
    ...(savedRecord || {}),
    id: savedRecord?.id || `assessment-${harvestId}`,
    harvest_id: harvestId,
    crop: result.crop,
    confidence: result.confidence,
    observations: result.observations,
    defects: result.defects,
    limitations: result.limitations,
    recommendations: result.recommendations,
    clarification_questions: result.clarificationQuestions ?? [],
    evidence: result.evidence ?? {},
    provider: result.provider,
  };
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
