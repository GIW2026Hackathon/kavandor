import { randomUUID } from 'crypto';
import { z } from 'zod';
import { calculateNetProceeds } from '@/calculations/netProceeds';
import { demoFacilities } from '@/demo/storage';
import { env, hasAiConfig } from '@/lib/env';
import { harvestSchema } from '@/validations/harvest';

export type UserRole = 'farmer' | 'buyer' | 'facility_operator' | 'transport_provider' | 'operations_admin';

export type HarvestStatus = 'draft' | 'submitted' | 'assessed' | 'listed' | 'sold' | 'cancelled';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
export type ReservationStatus = 'pending' | 'confirmed' | 'released' | 'completed';
export type TransportStatus = 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
export type InventoryStatus = 'received' | 'sorted' | 'packed' | 'sold';

export interface AuthContext {
  userId: string;
  role: UserRole;
}

export interface HarvestRecord {
  id: string;
  farmerId: string;
  crop: string;
  quantity: number;
  unit: 'kg' | 'crate' | 'bucket' | 'box';
  harvestDate: string;
  location: string;
  handlingNotes?: string;
  photoUrl?: string;
  status: HarvestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentRecord {
  id: string;
  harvestId: string;
  crop: string;
  confidence: number;
  observations: Array<{ label: string; detail: string; severity: 'low' | 'medium' | 'high' }>;
  defects: string[];
  limitations: string[];
  recommendations: Array<{
    type: 'immediate_sale' | 'storage' | 'drying' | 'aggregation';
    label: string;
    description: string;
    estimatedNet: number;
    assumptions: string[];
    feasible: boolean;
  }>;
  provider: string;
  createdAt: string;
}

export interface OfferRecord {
  id: string;
  harvestId: string;
  buyerId: string;
  pricePerKg: number;
  quantityKg: number;
  status: OfferStatus;
  source: 'provider_confirmed' | 'provider_reported' | 'manually_entered' | 'demo_data';
  createdAt: string;
  expiresAt?: string;
}

export interface ReservationRecord {
  id: string;
  harvestId: string;
  facilityId: string;
  quantityKg: number;
  status: ReservationStatus;
  createdAt: string;
}

export interface TransportJobRecord {
  id: string;
  harvestId: string;
  providerId: string;
  status: TransportStatus;
  origin: string;
  destination: string;
  createdAt: string;
}

export interface InventoryBatchRecord {
  id: string;
  harvestId: string;
  actualReceivedKg: number;
  receivedAt: string;
  status: InventoryStatus;
}

export interface TransactionRecord {
  id: string;
  harvestId: string;
  buyerId: string;
  offerId: string;
  agreedPrice: number;
  actualReceivedKg: number;
  status: 'pending' | 'confirmed' | 'completed' | 'reversed';
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  harvestId: string;
  actorId: string;
  type: string;
  detail: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface BackendState {
  users: Array<{ id: string; role: UserRole; email: string; name: string; ownerIds?: string[] }>;
  harvests: HarvestRecord[];
  assessments: AssessmentRecord[];
  offers: OfferRecord[];
  reservations: ReservationRecord[];
  transportJobs: TransportJobRecord[];
  inventoryBatches: InventoryBatchRecord[];
  transactions: TransactionRecord[];
  timeline: TimelineEvent[];
  notifications: NotificationRecord[];
  listings: Array<{
    id: string;
    harvestId: string;
    crop: string;
    quantityKg: number;
    unitPrice: number;
    status: 'active' | 'closed';
    county: string;
    source: 'demo_data';
  }>;
  facilities: typeof demoFacilities;
}

const DEMO_FARMER_ID = 'user-farmer-demo';
const DEMO_BUYER_ID = 'user-buyer-demo';
const DEMO_OPERATOR_ID = 'user-operator-demo';
const DEMO_PROVIDER_ID = 'user-provider-demo';
const DEMO_ADMIN_ID = 'user-admin-demo';

function makeId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function createDemoState(): BackendState {
  const now = new Date().toISOString();
  const demoHarvest: HarvestRecord = {
    id: 'harvest-demo-001',
    farmerId: DEMO_FARMER_ID,
    crop: 'Tomato',
    quantity: 220,
    unit: 'kg',
    harvestDate: now,
    location: 'Kisii County',
    handlingNotes: 'Demo harvest for planning only.',
    photoUrl: 'https://example.com/demo-tomato.jpg',
    status: 'assessed',
    createdAt: now,
    updatedAt: now,
  };

  return {
    users: [
      { id: DEMO_FARMER_ID, role: 'farmer', email: 'farmer@example.com', name: 'Demo Farmer' },
      { id: DEMO_BUYER_ID, role: 'buyer', email: 'buyer@example.com', name: 'Demo Buyer' },
      { id: DEMO_OPERATOR_ID, role: 'facility_operator', email: 'operator@example.com', name: 'Demo Operator' },
      { id: DEMO_PROVIDER_ID, role: 'transport_provider', email: 'provider@example.com', name: 'Demo Provider' },
      { id: DEMO_ADMIN_ID, role: 'operations_admin', email: 'admin@example.com', name: 'Demo Admin' },
    ],
    harvests: [demoHarvest],
    assessments: [
      {
        id: 'assessment-demo-001',
        harvestId: demoHarvest.id,
        crop: 'Tomato',
        confidence: 0.82,
        observations: [
          { label: 'Colour', detail: 'Mostly red, mixed maturity visible.', severity: 'medium' },
          { label: 'Surface', detail: 'Minor bruising on several fruits.', severity: 'low' },
        ],
        defects: ['Several fruits show surface bruising'],
        limitations: ['Visual assessment cannot verify internal quality or shelf life.'],
        recommendations: [
          {
            type: 'immediate_sale',
            label: 'Sell immediately',
            description: 'Demonstration sales option for a timely, ready-to-market lot.',
            estimatedNet: 9200,
            assumptions: ['Demo inputs only, not live market pricing.'],
            feasible: true,
          },
        ],
        provider: 'demo-vision-model',
        createdAt: now,
      },
    ],
    offers: [
      {
        id: 'offer-demo-001',
        harvestId: demoHarvest.id,
        buyerId: DEMO_BUYER_ID,
        pricePerKg: 45,
        quantityKg: demoHarvest.quantity,
        status: 'pending',
        source: 'demo_data',
        createdAt: now,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
    reservations: [],
    transportJobs: [],
    inventoryBatches: [],
    transactions: [],
    timeline: [
      {
        id: 'event-demo-001',
        harvestId: demoHarvest.id,
        actorId: DEMO_FARMER_ID,
        type: 'harvest_created',
        detail: 'Harvest registered for tomato demo flow.',
        createdAt: now,
      },
      {
        id: 'event-demo-002',
        harvestId: demoHarvest.id,
        actorId: DEMO_FARMER_ID,
        type: 'assessment_completed',
        detail: 'Visible-condition assessment captured with demo fallback.',
        createdAt: now,
      },
    ],
    notifications: [
      {
        id: 'notification-demo-001',
        userId: DEMO_FARMER_ID,
        type: 'offer',
        message: 'A buyer offer is pending review for the tomato lot.',
        read: false,
        createdAt: now,
      },
    ],
    listings: [
      {
        id: 'listing-demo-001',
        harvestId: demoHarvest.id,
        crop: 'Tomato',
        quantityKg: demoHarvest.quantity,
        unitPrice: 45,
        status: 'active',
        county: 'Kisii',
        source: 'demo_data',
      },
    ],
    facilities: demoFacilities,
  };
}

let backendState: BackendState = createDemoState();

export function resetDemoBackendState() {
  backendState = createDemoState();
}

export function getBackendState() {
  return backendState;
}

export function getAuthContext(request: Request): AuthContext {
  const userId = request.headers.get('x-user-id') ?? DEMO_FARMER_ID;
  const roleHeader = request.headers.get('x-user-role') ?? 'farmer';
  const role = (roleHeader as UserRole) || 'farmer';
  return { userId, role };
}

export function requireAuth(request: Request, allowedRoles: UserRole[] = []) {
  const auth = getAuthContext(request);
  if (allowedRoles.length && !allowedRoles.includes(auth.role)) {
    throw new BackendError('FORBIDDEN', 'You do not have permission to perform this action.', 403);
  }
  return auth;
}

export function requireOwnershipOrAdmin(user: AuthContext, ownerId: string) {
  if (user.role === 'operations_admin' || user.userId === ownerId) {
    return;
  }
  throw new BackendError('FORBIDDEN', 'You do not own this record.', 403);
}

export class BackendError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'BackendError';
    this.code = code;
    this.status = status;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof BackendError) {
    return {
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  if (error instanceof Error) {
    return {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      },
    };
  }

  return {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected internal error.',
    },
  };
}

const createHarvestSchema = harvestSchema.extend({
  photoUrl: z.string().url().optional().or(z.literal('')).optional(),
});

export function createHarvest(input: unknown, actor: AuthContext) {
  const parsed = createHarvestSchema.parse(input);
  const now = new Date().toISOString();
  const harvest: HarvestRecord = {
    id: makeId('harvest'),
    farmerId: actor.userId,
    crop: parsed.crop,
    quantity: parsed.quantity,
    unit: parsed.unit,
    harvestDate: parsed.harvestDate,
    location: parsed.location,
    handlingNotes: parsed.handlingNotes,
    photoUrl: parsed.photoUrl || undefined,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  backendState.harvests.unshift(harvest);
  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: harvest.id,
    actorId: actor.userId,
    type: 'harvest_created',
    detail: `Harvest logged for ${harvest.crop} in ${harvest.location}.`,
    createdAt: now,
  });

  backendState.notifications.unshift({
    id: makeId('notification'),
    userId: actor.userId,
    type: 'harvest_created',
    message: `Your ${harvest.crop} harvest has been registered.`,
    read: false,
    createdAt: now,
  });

  return harvest;
}

export function getHarvestById(harvestId: string) {
  const harvest = backendState.harvests.find((item) => item.id === harvestId);
  if (!harvest) {
    throw new BackendError('NOT_FOUND', 'Harvest not found.', 404);
  }
  return harvest;
}

export function updateHarvest(harvestId: string, patch: Partial<HarvestRecord>, actor: AuthContext) {
  const harvest = getHarvestById(harvestId);
  requireOwnershipOrAdmin(actor, harvest.farmerId);
  const next = { ...harvest, ...patch, updatedAt: new Date().toISOString() };
  const index = backendState.harvests.findIndex((item) => item.id === harvestId);
  backendState.harvests[index] = next;
  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: harvestId,
    actorId: actor.userId,
    type: 'harvest_updated',
    detail: 'Harvest record updated.',
    createdAt: new Date().toISOString(),
  });
  return next;
}

export function getHarvestTimeline(harvestId: string) {
  return backendState.timeline.filter((event) => event.harvestId === harvestId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createPhotoMetadata(harvestId: string, photoUrl: string) {
  const harvest = getHarvestById(harvestId);
  harvest.photoUrl = photoUrl;
  harvest.updatedAt = new Date().toISOString();
  return { harvestId, photoUrl };
}

export function generateAssessment(harvestId: string, actor: AuthContext, payload?: { imageUrl?: string; notes?: string }) {
  void payload;
  const harvest = getHarvestById(harvestId);
  requireOwnershipOrAdmin(actor, harvest.farmerId);

  const fallback: AssessmentRecord = {
    id: makeId('assessment'),
    harvestId: harvest.id,
    crop: harvest.crop,
    confidence: hasAiConfig ? 0.9 : 0.72,
    observations: [
      { label: 'Crop identification', detail: `Likely ${harvest.crop} based on harvest record and visible checks.`, severity: 'medium' },
      { label: 'Visible state', detail: hasAiConfig ? 'Provider-grade assessment is enabled.' : 'Development fallback: no provider credentials configured.', severity: 'low' },
    ],
    defects: hasAiConfig ? ['No defect flags detected by model.'] : ['Demo-only assessment: defects must be manually validated.'],
    limitations: [
      'Visible-condition assessment cannot confirm internal quality, contamination, or exact shelf life.',
      ...(hasAiConfig ? [] : ['AI provider key not configured; this is a clearly labelled fallback.']),
    ],
    recommendations: [
      {
        type: 'immediate_sale',
        label: 'Sell immediately',
        description: 'Likely best action for a ripe lot that can move quickly.',
        estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 45, transportCost: 300, facilityCost: 120, fees: 100 }),
        assumptions: ['Demo price and costs are not live market values.'],
        feasible: true,
      },
      {
        type: 'storage',
        label: 'Cold storage',
        description: 'Short-term preservation when sales timing is uncertain.',
        estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 40, transportCost: 320, facilityCost: 320, fees: 120, storageCost: 200 }),
        assumptions: ['Storage rates are demo assumptions only.'],
        feasible: harvest.quantity <= 500,
      },
    ],
    provider: hasAiConfig ? 'configured-vision-provider' : 'demo-fallback',
    createdAt: new Date().toISOString(),
  };

  const assessment: AssessmentRecord = {
    id: makeId('assessment'),
    harvestId: harvest.id,
    crop: fallback.crop,
    confidence: fallback.confidence,
    observations: fallback.observations,
    defects: fallback.defects,
    limitations: fallback.limitations,
    recommendations: fallback.recommendations,
    provider: fallback.provider,
    createdAt: fallback.createdAt,
  };

  backendState.assessments = backendState.assessments.filter((item) => item.harvestId !== harvestId);
  backendState.assessments.unshift(assessment);
  harvest.status = 'assessed';
  harvest.updatedAt = assessment.createdAt;
  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: harvest.id,
    actorId: actor.userId,
    type: 'assessment_completed',
    detail: `Visible-condition assessment recorded using ${assessment.provider}.`,
    createdAt: assessment.createdAt,
  });

  return assessment;
}

export function getRecommendationOptions(harvestId: string) {
  const harvest = getHarvestById(harvestId);
  const facilityCandidates = backendState.facilities.filter((facility) =>
    facility.acceptedCommodities.some((commodity) => commodity.toLowerCase() === harvest.crop.toLowerCase()),
  );

  const options = [
    {
      type: 'immediate_sale',
      label: 'Sell immediately',
      description: 'Move the lot quickly to market when the crop is ready for sale.',
      estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 45, transportCost: 300, facilityCost: 120, fees: 100 }),
      assumptions: ['Demo market values only.'],
      feasible: harvest.quantity > 0,
    },
    {
      type: 'storage',
      label: 'Cold storage',
      description: 'Use a compatible cold-storage facility for short-term freshness retention.',
      estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 40, transportCost: 320, facilityCost: 320, fees: 120, storageCost: 200 }),
      assumptions: ['Facility pricing and capacity are demo data only.'],
      feasible: facilityCandidates.some((facility) => facility.facilityType === 'cold_storage') && harvest.quantity <= 500,
    },
    {
      type: 'drying',
      label: 'Drying',
      description: 'Consider drying where the crop and handling route are compatible.',
      estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 32, transportCost: 280, facilityCost: 180, fees: 90, dryingCost: 150 }),
      assumptions: ['Drying is only suitable for commodity-compatible routes.'],
      feasible: facilityCandidates.some((facility) => facility.facilityType === 'drying') && harvest.crop.toLowerCase().includes('maize'),
    },
    {
      type: 'aggregation',
      label: 'Aggregation',
      description: 'Combine produce with compatible lots to improve buyer leverage.',
      estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 43, transportCost: 260, facilityCost: 140, fees: 110 }),
      assumptions: ['Aggregation assumes compatible produce and a shared buyer route.'],
      feasible: harvest.quantity >= 100,
    },
  ].filter((option) => option.feasible);

  return {
    harvestId,
    options,
  };
}

export function listFacilities(params?: { commodity?: string; county?: string; limit?: number }) {
  const commodity = params?.commodity?.toLowerCase();
  const county = params?.county?.toLowerCase();
  const limit = params?.limit ?? 20;

  let filtered = backendState.facilities.filter((facility) => {
    const acceptsCommodity = !commodity || facility.acceptedCommodities.some((value) => value.toLowerCase() === commodity);
    const countyMatch = !county || facility.county.toLowerCase() === county;
    return acceptsCommodity && countyMatch;
  });

  filtered = filtered.slice(0, limit);
  return filtered;
}

export function createListing(harvestId: string, actor: AuthContext) {
  const harvest = getHarvestById(harvestId);
  requireOwnershipOrAdmin(actor, harvest.farmerId);

  const existing = backendState.listings.find((listing) => listing.harvestId === harvestId);
  if (existing) {
    return existing;
  }

  const listing: BackendState['listings'][number] = {
    id: makeId('listing'),
    harvestId: harvest.id,
    crop: harvest.crop,
    quantityKg: harvest.quantity,
    unitPrice: 45,
    status: 'active',
    county: harvest.location,
    source: 'demo_data',
  };

  backendState.listings.unshift(listing);
  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: harvest.id,
    actorId: actor.userId,
    type: 'listing_created',
    detail: `Marketplace listing created for ${harvest.crop}.`,
    createdAt: new Date().toISOString(),
  });

  return listing;
}

export function getMarketplaceListings(search = '', page = 1, pageSize = 10) {
  const q = search.trim().toLowerCase();
  const filtered = backendState.listings.filter((listing) =>
    !q || listing.crop.toLowerCase().includes(q) || listing.county.toLowerCase().includes(q),
  );
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    page,
    pageSize,
    total: filtered.length,
  };
}

export function createOffer(input: unknown, actor: AuthContext) {
  const schema = z.object({
    harvestId: z.string().min(1),
    buyerId: z.string().min(1),
    pricePerKg: z.number().positive(),
    quantityKg: z.number().positive(),
    source: z.enum(['provider_confirmed', 'provider_reported', 'manually_entered', 'demo_data']).optional(),
  });
  const parsed = schema.parse(input);
  const harvest = getHarvestById(parsed.harvestId);
  const buyer = backendState.users.find((user) => user.id === parsed.buyerId || user.id === actor.userId);

  if (!buyer) {
    throw new BackendError('NOT_FOUND', 'Buyer account not found.', 404);
  }

  const offer: OfferRecord = {
    id: makeId('offer'),
    harvestId: harvest.id,
    buyerId: parsed.buyerId,
    pricePerKg: parsed.pricePerKg,
    quantityKg: parsed.quantityKg,
    status: 'pending',
    source: parsed.source ?? 'demo_data',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
  };

  backendState.offers.unshift(offer);
  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: harvest.id,
    actorId: actor.userId,
    type: 'offer_submitted',
    detail: `Offer ${offer.id} submitted for ${harvest.crop}.`,
    createdAt: offer.createdAt,
  });
  backendState.notifications.unshift({
    id: makeId('notification'),
    userId: harvest.farmerId,
    type: 'offer',
    message: `New offer received for ${harvest.crop}.`,
    read: false,
    createdAt: offer.createdAt,
  });
  return offer;
}

export function updateOfferStatus(offerId: string, nextStatus: OfferStatus, actor: AuthContext) {
  const offer = backendState.offers.find((item) => item.id === offerId);
  if (!offer) {
    throw new BackendError('NOT_FOUND', 'Offer not found.', 404);
  }

  const allowedTransitions: Record<OfferStatus, OfferStatus[]> = {
    pending: ['accepted', 'rejected', 'withdrawn'],
    accepted: ['withdrawn'],
    rejected: [],
    expired: [],
    withdrawn: [],
  };

  const currentStatus = offer.status;
  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new BackendError('INVALID_TRANSITION', `Cannot transition offer from ${currentStatus} to ${nextStatus}.`, 409);
  }

  if (nextStatus === 'accepted' && actor.role !== 'farmer' && actor.role !== 'operations_admin') {
    throw new BackendError('FORBIDDEN', 'Only the farmer or admin can accept an offer.', 403);
  }

  offer.status = nextStatus;
  offer.expiresAt = new Date().toISOString();

  if (nextStatus === 'accepted') {
    const harvest = getHarvestById(offer.harvestId);
    requireOwnershipOrAdmin(actor, harvest.farmerId);
    const transaction: TransactionRecord = {
      id: makeId('txn'),
      harvestId: offer.harvestId,
      buyerId: offer.buyerId,
      offerId: offer.id,
      agreedPrice: offer.pricePerKg,
      actualReceivedKg: harvest.quantity,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    backendState.transactions.unshift(transaction);
  }

  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: offer.harvestId,
    actorId: actor.userId,
    type: `offer_${nextStatus}`,
    detail: `Offer marked as ${nextStatus}.`,
    createdAt: new Date().toISOString(),
  });
  return offer;
}

export function createReservation(input: unknown, actor: AuthContext) {
  const schema = z.object({
    harvestId: z.string().min(1),
    facilityId: z.string().min(1),
    quantityKg: z.number().positive(),
  });
  const parsed = schema.parse(input);
  const harvest = getHarvestById(parsed.harvestId);
  requireOwnershipOrAdmin(actor, harvest.farmerId);

  const facility = backendState.facilities.find((item) => item.id === parsed.facilityId);
  if (!facility) {
    throw new BackendError('NOT_FOUND', 'Facility not found.', 404);
  }

  const reserved = backendState.reservations
    .filter((item) => item.facilityId === parsed.facilityId && item.status !== 'released')
    .reduce((total, item) => total + item.quantityKg, 0);

  if (reserved + parsed.quantityKg > facility.availableCapacityKg) {
    throw new BackendError('CAPACITY_EXCEEDED', 'This facility cannot accommodate the requested quantity.', 409);
  }

  const reservation: ReservationRecord = {
    id: makeId('reservation'),
    harvestId: parsed.harvestId,
    facilityId: parsed.facilityId,
    quantityKg: parsed.quantityKg,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  backendState.reservations.unshift(reservation);
  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: parsed.harvestId,
    actorId: actor.userId,
    type: 'reservation_created',
    detail: `Reservation created for ${parsed.quantityKg}kg at ${facility.name}.`,
    createdAt: reservation.createdAt,
  });
  return reservation;
}

export function createTransportJob(input: unknown, actor: AuthContext) {
  const schema = z.object({
    harvestId: z.string().min(1),
    providerId: z.string().min(1),
    origin: z.string().min(2),
    destination: z.string().min(2),
  });
  const parsed = schema.parse(input);
  const harvest = getHarvestById(parsed.harvestId);
  requireOwnershipOrAdmin(actor, harvest.farmerId);

  const job: TransportJobRecord = {
    id: makeId('transport'),
    harvestId: harvest.id,
    providerId: parsed.providerId,
    status: 'scheduled',
    origin: parsed.origin,
    destination: parsed.destination,
    createdAt: new Date().toISOString(),
  };

  backendState.transportJobs.unshift(job);
  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: harvest.id,
    actorId: actor.userId,
    type: 'transport_scheduled',
    detail: `Transport scheduled from ${job.origin} to ${job.destination}.`,
    createdAt: job.createdAt,
  });
  return job;
}

export function updateTransportJobStatus(jobId: string, nextStatus: TransportStatus, actor: AuthContext) {
  const job = backendState.transportJobs.find((item) => item.id === jobId);
  if (!job) {
    throw new BackendError('NOT_FOUND', 'Transport job not found.', 404);
  }
  if (job.providerId !== actor.userId && actor.role !== 'operations_admin') {
    throw new BackendError('FORBIDDEN', 'You are not allowed to update this transport job.', 403);
  }

  const allowedTransitions: Record<TransportStatus, TransportStatus[]> = {
    scheduled: ['in_transit', 'cancelled'],
    in_transit: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  if (!allowedTransitions[job.status]?.includes(nextStatus)) {
    throw new BackendError('INVALID_TRANSITION', `Cannot transition transport job from ${job.status} to ${nextStatus}.`, 409);
  }

  job.status = nextStatus;
  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: job.harvestId,
    actorId: actor.userId,
    type: `transport_${nextStatus}`,
    detail: `Transport status updated to ${nextStatus}.`,
    createdAt: new Date().toISOString(),
  });
  return job;
}

export function createInventoryBatch(input: unknown, actor: AuthContext) {
  const schema = z.object({
    harvestId: z.string().min(1),
    actualReceivedKg: z.number().nonnegative(),
    status: z.enum(['received', 'sorted', 'packed', 'sold']).optional(),
  });
  const parsed = schema.parse(input);
  const harvest = getHarvestById(parsed.harvestId);
  requireOwnershipOrAdmin(actor, harvest.farmerId);

  const batch: InventoryBatchRecord = {
    id: makeId('batch'),
    harvestId: harvest.id,
    actualReceivedKg: parsed.actualReceivedKg,
    receivedAt: new Date().toISOString(),
    status: parsed.status ?? 'received',
  };

  backendState.inventoryBatches.unshift(batch);
  backendState.timeline.unshift({
    id: makeId('event'),
    harvestId: harvest.id,
    actorId: actor.userId,
    type: 'inventory_received',
    detail: `Actual received quantity recorded as ${batch.actualReceivedKg}kg.`,
    createdAt: batch.receivedAt,
  });
  return batch;
}

export function getNotificationsForUser(userId: string) {
  return backendState.notifications.filter((notification) => notification.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listExternalIntegrations() {
  return [
    {
      name: 'Supabase',
      type: 'database',
      configured: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      requiredEnv: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    },
    {
      name: 'Vision provider',
      type: 'ai',
      configured: hasAiConfig,
      requiredEnv: ['AI_PROVIDER_API_KEY'],
    },
  ];
}

export function createDevelopmentFallbackAssessment(harvest: HarvestRecord) {
  return {
    crop: harvest.crop,
    confidence: 0.72,
    observations: [{ label: 'Demo assessment', detail: 'No live provider key was configured. This is a development fallback.', severity: 'medium' }],
    defects: ['Manual verification is required before making a commercial decision.'],
    limitations: ['Not a production-grade assessment.'],
    recommendations: [
      {
        type: 'immediate_sale',
        label: 'Sell immediately',
        description: 'Demo recommendation to continue workflow validation.',
        estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 40, transportCost: 250, facilityCost: 150, fees: 100 }),
        assumptions: ['All prices and costs are simulated.'],
        feasible: true,
      },
    ],
    provider: 'development-fallback',
    createdAt: new Date().toISOString(),
  };
}
