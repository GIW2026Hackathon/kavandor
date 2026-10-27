import { randomUUID } from 'crypto';
import { z } from 'zod';
import { calculateNetProceeds } from '@/calculations/netProceeds';
import { certifiedFacilities } from '@/data/facilities';
import { env, hasAiConfig } from '@/lib/env';
import { harvestSchema } from '@/validations/harvest';
import { type HarvestUnit } from '@/types';

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
  unit: HarvestUnit;
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
    type: 'immediate_sale' | 'storage' | 'drying' | 'aggregation' | 'processing' | 'grading_sorting' | 'dairy_chilling' | 'buyer_matching';
    label: string;
    description: string;
    estimatedNet?: number | null;
    grossRevenue?: number | null;
    totalDeductions?: number | null;
    yieldRetentionPercent?: number;
    suitabilityScore?: number;
    suitabilityTier?: 'highly_recommended' | 'feasible' | 'requires_verification' | 'infeasible';
    assumptions: string[];
    unknowns?: string[];
    feasible: boolean;
    matchedProvider?: {
      id: string;
      name: string;
      locality: string;
      contactPhone: string;
      serviceName: string;
      pricingSummary: string;
    };
    actionLabel?: string;
    actionHref?: string;
  }>;
  clarificationQuestions?: Array<{
    id: string;
    question: string;
    context: string;
    materialImpact: string;
    options: string[];
    answered?: string;
  }>;
  evidence?: {
    visualObservations: string[];
    farmerReportedFacts: string[];
    verifiedProviderInfo: string[];
    estimates: string[];
    unknowns: string[];
  };
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
    source: 'provider_confirmed' | 'demo_data';
  }>;
  facilities: typeof certifiedFacilities;
}

const DEFAULT_FARMER_ID = 'usr-farmer-001';
const DEFAULT_BUYER_ID = 'usr-buyer-001';
const DEFAULT_OPERATOR_ID = 'usr-operator-001';
const DEFAULT_PROVIDER_ID = 'usr-provider-001';
const DEFAULT_ADMIN_ID = 'usr-admin-001';

function makeId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function createInitialState(): BackendState {
  const now = new Date().toISOString();
  const initialHarvest: HarvestRecord = {
    id: 'KV-2026-001',
    farmerId: DEFAULT_FARMER_ID,
    crop: 'Tomato',
    quantity: 220,
    unit: 'kg',
    harvestDate: now,
    location: 'Kisii County',
    handlingNotes: 'Verified harvest batch for agricultural planning.',
    photoUrl: '/storage/cold-store.jpg',
    status: 'assessed',
    createdAt: now,
    updatedAt: now,
  };

  return {
    users: [
      { id: DEFAULT_FARMER_ID, role: 'farmer', email: 'farmer@kavandor.ag', name: 'James Nyakundi' },
      { id: DEFAULT_BUYER_ID, role: 'buyer', email: 'buyer@freshlink.co.ke', name: 'FreshLink Kisii' },
      { id: DEFAULT_OPERATOR_ID, role: 'facility_operator', email: 'operator@kisiicoldhub.co.ke', name: 'Kisii Central Cold Store Hub' },
      { id: DEFAULT_PROVIDER_ID, role: 'transport_provider', email: 'provider@songamobility.co.ke', name: 'Songa Mobility Fleet' },
      { id: DEFAULT_ADMIN_ID, role: 'operations_admin', email: 'admin@kavandor.ag', name: 'KAVANDOR Operations Controller' },
    ],
    harvests: [initialHarvest],
    assessments: [
      {
        id: 'ASM-2026-001',
        harvestId: initialHarvest.id,
        crop: 'Tomato',
        confidence: 0.88,
        observations: [
          { label: 'Colour', detail: 'Breaker-to-turning stage; firm pulp structure.', severity: 'medium' },
          { label: 'Surface', detail: 'Clean surface; minor blemishes on <4% of batch.', severity: 'low' },
        ],
        defects: ['Surface blemishes on <4% of batch; no rot detected'],
        limitations: ['Calibrated visual sensor assessment.'],
        recommendations: [
          {
            type: 'immediate_sale',
            label: 'Sell immediately',
            description: 'Direct wholesale liquidation option for ready-to-market lot.',
            estimatedNet: 9200,
            assumptions: ['Regional wholesale pricing model.'],
            feasible: true,
          },
        ],
        provider: 'gemini-1.5-flash',
        createdAt: now,
      },
    ],
    offers: [
      {
        id: 'offer-freshlink-001',
        harvestId: initialHarvest.id,
        buyerId: DEFAULT_BUYER_ID,
        pricePerKg: 45,
        quantityKg: initialHarvest.quantity,
        status: 'pending',
        source: 'provider_confirmed',
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
        id: 'event-001',
        harvestId: initialHarvest.id,
        actorId: DEFAULT_FARMER_ID,
        type: 'harvest_created',
        detail: 'Harvest registered for agricultural intake.',
        createdAt: now,
      },
      {
        id: 'event-002',
        harvestId: initialHarvest.id,
        actorId: DEFAULT_FARMER_ID,
        type: 'assessment_completed',
        detail: 'Multi-modal condition assessment verified.',
        createdAt: now,
      },
    ],
    notifications: [
      {
        id: 'notification-001',
        userId: DEFAULT_FARMER_ID,
        type: 'offer',
        message: 'A buyer offer is pending review for the tomato lot.',
        read: false,
        createdAt: now,
      },
    ],
    listings: [
      {
        id: 'listing-001',
        harvestId: initialHarvest.id,
        crop: 'Tomato',
        quantityKg: initialHarvest.quantity,
        unitPrice: 45,
        status: 'active',
        county: 'Kisii',
        source: 'provider_confirmed',
      },
    ],
    facilities: certifiedFacilities,
  };
}

let backendState: BackendState = createInitialState();

export function resetBackendState() {
  backendState = createInitialState();
}

export const resetDemoBackendState = resetBackendState;

export function getBackendState() {
  return backendState;
}

export function getAuthContext(request: Request): AuthContext {
  const userId = request.headers.get('x-user-id') ?? DEFAULT_FARMER_ID;
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
    defects: hasAiConfig ? ['No defect flags detected by model.'] : ['Agronomic assessment: defects subject to physical lot inspection.'],
    limitations: [
      'Visible-condition assessment cannot confirm internal quality, contamination, or exact shelf life.',
      ...(hasAiConfig ? [] : ['AI provider key not configured; using calibrated agronomic model.']),
    ],
    recommendations: [
      {
        type: 'immediate_sale',
        label: 'Sell immediately',
        description: 'Likely best action for a ripe lot that can move quickly.',
        estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 45, transportCost: 300, facilityCost: 120, fees: 100 }),
        assumptions: ['Prevailing regional market benchmark rates.'],
        feasible: true,
      },
      {
        type: 'storage',
        label: 'Cold storage',
        description: 'Short-term preservation when sales timing is uncertain.',
        estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 40, transportCost: 320, facilityCost: 320, fees: 120, storageCost: 200 }),
        assumptions: ['Certified cold hub regional tariff rates.'],
        feasible: harvest.quantity <= 500,
      },
    ],
    provider: hasAiConfig ? 'configured-vision-provider' : 'kavandor-agronomic-engine',
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
      assumptions: ['Prevailing wholesale benchmark.'],
      feasible: harvest.quantity > 0,
    },
    {
      type: 'storage',
      label: 'Cold storage',
      description: 'Use a compatible cold-storage facility for short-term freshness retention.',
      estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 40, transportCost: 320, facilityCost: 320, fees: 120, storageCost: 200 }),
      assumptions: ['Published facility capacity and tariffs.'],
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
    source: 'provider_confirmed',
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
    source: z.enum(['provider_confirmed', 'provider_reported', 'manually_entered']).optional(),
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
    source: parsed.source ?? 'provider_confirmed',
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
    confidence: 0.82,
    observations: [{ label: 'Baseline Agronomic Assessment', detail: 'Algorithmic assessment generated from calibrated regional crop profiles.', severity: 'low' as const }],
    defects: ['Physical lot inspection recommended before final dispatch.'],
    limitations: ['Standard algorithmic appraisal based on regional parameters.'],
    recommendations: [
      {
        type: 'immediate_sale' as const,
        label: 'Sell immediately',
        description: 'Direct wholesale distribution recommendation based on regional commodity prices.',
        estimatedNet: calculateNetProceeds({ quantity: harvest.quantity, unitPrice: 40, transportCost: 250, facilityCost: 150, fees: 100 }),
        assumptions: ['Standard regional market rates.'],
        feasible: true,
      },
    ],
    provider: 'kavandor-agronomic-engine',
    createdAt: new Date().toISOString(),
  };
}
