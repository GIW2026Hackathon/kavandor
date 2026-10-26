import { randomUUID } from 'crypto';
import { demoFacilities, type DemoFacility } from '@/demo/storage';
import {
  type AssessmentRecord,
  type HarvestRecord,
  type InventoryBatchRecord,
  type OfferRecord,
  type ReservationRecord,
  type TimelineEvent,
  type TransactionRecord,
  type TransportJobRecord,
  getBackendState,
} from '@/lib/backend';
import { env, hasSupabaseConfig } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export interface WorkflowException {
  id: string;
  harvestId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  title: string;
  description: string;
  suggestedAction: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  actionTaken?: string;
}

export interface CapacitySlotRecord {
  id: string;
  facilityId: string;
  capacityKg: number;
  reservedKg: number;
  windowStart: string;
  windowEnd: string;
}

export interface IDatabaseAdapter {
  readonly mode: 'supabase' | 'memory';

  // Harvests
  getHarvests(filter?: { farmerId?: string; status?: string }): Promise<HarvestRecord[]>;
  getHarvestById(id: string): Promise<HarvestRecord | null>;
  createHarvest(data: Omit<HarvestRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HarvestRecord>;
  updateHarvest(id: string, patch: Partial<HarvestRecord>): Promise<HarvestRecord>;

  // Assessments
  getAssessments(harvestId?: string): Promise<AssessmentRecord[]>;
  saveAssessment(assessment: AssessmentRecord): Promise<AssessmentRecord>;

  // Facilities & Capacity
  getFacilities(): Promise<DemoFacility[]>;
  getCapacitySlots(facilityId?: string): Promise<CapacitySlotRecord[]>;
  getReservations(filter?: { harvestId?: string; facilityId?: string }): Promise<ReservationRecord[]>;
  createReservation(data: {
    harvestId: string;
    facilityId: string;
    quantityKg: number;
    capacitySlotId?: string;
  }): Promise<ReservationRecord>;
  updateReservationStatus(id: string, status: ReservationRecord['status']): Promise<ReservationRecord>;

  // Transport
  getTransportJobs(filter?: { harvestId?: string; providerId?: string }): Promise<TransportJobRecord[]>;
  createTransportJob(data: {
    harvestId: string;
    providerId: string;
    origin: string;
    destination: string;
  }): Promise<TransportJobRecord>;
  updateTransportStatus(id: string, status: TransportJobRecord['status']): Promise<TransportJobRecord>;

  // Offers & Marketplace
  getOffers(filter?: { harvestId?: string; buyerId?: string }): Promise<OfferRecord[]>;
  createOffer(data: {
    harvestId: string;
    buyerId: string;
    pricePerKg: number;
    quantityKg: number;
    source?: OfferRecord['source'];
    expiresAt?: string;
  }): Promise<OfferRecord>;
  updateOfferStatus(id: string, status: OfferRecord['status']): Promise<OfferRecord>;

  // Inventory & Quality
  getInventoryBatches(harvestId?: string): Promise<InventoryBatchRecord[]>;
  createInventoryBatch(data: {
    harvestId: string;
    actualReceivedKg: number;
    status?: InventoryBatchRecord['status'];
  }): Promise<InventoryBatchRecord>;

  // Transactions & Settlements
  getTransactions(filter?: { harvestId?: string; buyerId?: string }): Promise<TransactionRecord[]>;
  createTransaction(data: {
    harvestId: string;
    buyerId: string;
    offerId: string;
    agreedPrice: number;
    actualReceivedKg: number;
  }): Promise<TransactionRecord>;

  // Audit Timeline & Activity
  getActivityEvents(harvestId?: string): Promise<TimelineEvent[]>;
  logActivityEvent(event: {
    harvestId?: string;
    actorId?: string;
    eventType: string;
    details?: Record<string, unknown>;
  }): Promise<TimelineEvent>;

  // Workflow Exceptions
  getExceptions(filter?: { resolved?: boolean; harvestId?: string }): Promise<WorkflowException[]>;
  createException(exception: Omit<WorkflowException, 'id' | 'createdAt' | 'resolved'>): Promise<WorkflowException>;
  resolveException(id: string, actionTaken: string): Promise<WorkflowException>;
}

// In-Memory store for workflow exceptions during development or fallback
const inMemoryExceptions: WorkflowException[] = [];

/**
 * Memory Database Adapter
 * Backed by the in-memory state in src/lib/backend.ts
 */
export class MemoryDatabaseAdapter implements IDatabaseAdapter {
  readonly mode = 'memory' as const;

  async getHarvests(filter?: { farmerId?: string; status?: string }): Promise<HarvestRecord[]> {
    let list = [...getBackendState().harvests];
    if (filter?.farmerId) {
      list = list.filter((h) => h.farmerId === filter.farmerId);
    }
    if (filter?.status) {
      list = list.filter((h) => h.status === filter.status);
    }
    return list;
  }

  async getHarvestById(id: string): Promise<HarvestRecord | null> {
    const found = getBackendState().harvests.find((h) => h.id === id);
    return found ? { ...found } : null;
  }

  async createHarvest(data: Omit<HarvestRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HarvestRecord> {
    const now = new Date().toISOString();
    const record: HarvestRecord = {
      ...data,
      id: `harvest-${randomUUID().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    getBackendState().harvests.unshift(record);
    return record;
  }

  async updateHarvest(id: string, patch: Partial<HarvestRecord>): Promise<HarvestRecord> {
    const state = getBackendState();
    const index = state.harvests.findIndex((h) => h.id === id);
    if (index === -1) {
      throw new Error(`Harvest ${id} not found.`);
    }
    const updated: HarvestRecord = {
      ...state.harvests[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    state.harvests[index] = updated;
    return updated;
  }

  async getAssessments(harvestId?: string): Promise<AssessmentRecord[]> {
    const list = getBackendState().assessments;
    if (harvestId) {
      return list.filter((a) => a.harvestId === harvestId);
    }
    return [...list];
  }

  async saveAssessment(assessment: AssessmentRecord): Promise<AssessmentRecord> {
    const state = getBackendState();
    const index = state.assessments.findIndex((a) => a.id === assessment.id || a.harvestId === assessment.harvestId);
    if (index >= 0) {
      state.assessments[index] = assessment;
    } else {
      state.assessments.unshift(assessment);
    }
    return assessment;
  }

  async getFacilities(): Promise<DemoFacility[]> {
    return [...demoFacilities];
  }

  async getCapacitySlots(facilityId?: string): Promise<CapacitySlotRecord[]> {
    // Generate synthetic capacity slots matching demo facilities
    const facilities = await this.getFacilities();
    const slots: CapacitySlotRecord[] = facilities.map((f, i) => ({
      id: `slot-${f.id}-${i}`,
      facilityId: f.id,
      capacityKg: f.availableCapacityKg + 500,
      reservedKg: 500,
      windowStart: new Date().toISOString(),
      windowEnd: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    }));
    return facilityId ? slots.filter((s) => s.facilityId === facilityId) : slots;
  }

  async getReservations(filter?: { harvestId?: string; facilityId?: string }): Promise<ReservationRecord[]> {
    let list = [...getBackendState().reservations];
    if (filter?.harvestId) list = list.filter((r) => r.harvestId === filter.harvestId);
    if (filter?.facilityId) list = list.filter((r) => r.facilityId === filter.facilityId);
    return list;
  }

  async createReservation(data: {
    harvestId: string;
    facilityId: string;
    quantityKg: number;
    capacitySlotId?: string;
  }): Promise<ReservationRecord> {
    const now = new Date().toISOString();
    const record: ReservationRecord = {
      id: `res-${randomUUID().slice(0, 8)}`,
      harvestId: data.harvestId,
      facilityId: data.facilityId,
      quantityKg: data.quantityKg,
      status: 'pending',
      createdAt: now,
    };
    getBackendState().reservations.unshift(record);
    return record;
  }

  async updateReservationStatus(id: string, status: ReservationRecord['status']): Promise<ReservationRecord> {
    const state = getBackendState();
    const index = state.reservations.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`Reservation ${id} not found.`);
    state.reservations[index].status = status;
    return state.reservations[index];
  }

  async getTransportJobs(filter?: { harvestId?: string; providerId?: string }): Promise<TransportJobRecord[]> {
    let list = [...getBackendState().transportJobs];
    if (filter?.harvestId) list = list.filter((t) => t.harvestId === filter.harvestId);
    if (filter?.providerId) list = list.filter((t) => t.providerId === filter.providerId);
    return list;
  }

  async createTransportJob(data: {
    harvestId: string;
    providerId: string;
    origin: string;
    destination: string;
  }): Promise<TransportJobRecord> {
    const now = new Date().toISOString();
    const record: TransportJobRecord = {
      id: `trans-${randomUUID().slice(0, 8)}`,
      harvestId: data.harvestId,
      providerId: data.providerId,
      origin: data.origin,
      destination: data.destination,
      status: 'scheduled',
      createdAt: now,
    };
    getBackendState().transportJobs.unshift(record);
    return record;
  }

  async updateTransportStatus(id: string, status: TransportJobRecord['status']): Promise<TransportJobRecord> {
    const state = getBackendState();
    const index = state.transportJobs.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Transport job ${id} not found.`);
    state.transportJobs[index].status = status;
    return state.transportJobs[index];
  }

  async getOffers(filter?: { harvestId?: string; buyerId?: string }): Promise<OfferRecord[]> {
    let list = [...getBackendState().offers];
    if (filter?.harvestId) list = list.filter((o) => o.harvestId === filter.harvestId);
    if (filter?.buyerId) list = list.filter((o) => o.buyerId === filter.buyerId);
    return list;
  }

  async createOffer(data: {
    harvestId: string;
    buyerId: string;
    pricePerKg: number;
    quantityKg: number;
    source?: OfferRecord['source'];
    expiresAt?: string;
  }): Promise<OfferRecord> {
    const now = new Date().toISOString();
    const record: OfferRecord = {
      id: `offer-${randomUUID().slice(0, 8)}`,
      harvestId: data.harvestId,
      buyerId: data.buyerId,
      pricePerKg: data.pricePerKg,
      quantityKg: data.quantityKg,
      status: 'pending',
      source: data.source || 'manually_entered',
      createdAt: now,
      expiresAt: data.expiresAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };
    getBackendState().offers.unshift(record);
    return record;
  }

  async updateOfferStatus(id: string, status: OfferRecord['status']): Promise<OfferRecord> {
    const state = getBackendState();
    const index = state.offers.findIndex((o) => o.id === id);
    if (index === -1) throw new Error(`Offer ${id} not found.`);
    state.offers[index].status = status;
    return state.offers[index];
  }

  async getInventoryBatches(harvestId?: string): Promise<InventoryBatchRecord[]> {
    const list = getBackendState().inventoryBatches;
    return harvestId ? list.filter((b) => b.harvestId === harvestId) : [...list];
  }

  async createInventoryBatch(data: {
    harvestId: string;
    actualReceivedKg: number;
    status?: InventoryBatchRecord['status'];
  }): Promise<InventoryBatchRecord> {
    const now = new Date().toISOString();
    const record: InventoryBatchRecord = {
      id: `batch-${randomUUID().slice(0, 8)}`,
      harvestId: data.harvestId,
      actualReceivedKg: data.actualReceivedKg,
      receivedAt: now,
      status: data.status || 'received',
    };
    getBackendState().inventoryBatches.unshift(record);
    return record;
  }

  async getTransactions(filter?: { harvestId?: string; buyerId?: string }): Promise<TransactionRecord[]> {
    let list = [...getBackendState().transactions];
    if (filter?.harvestId) list = list.filter((tx) => tx.harvestId === filter.harvestId);
    if (filter?.buyerId) list = list.filter((tx) => tx.buyerId === filter.buyerId);
    return list;
  }

  async createTransaction(data: {
    harvestId: string;
    buyerId: string;
    offerId: string;
    agreedPrice: number;
    actualReceivedKg: number;
  }): Promise<TransactionRecord> {
    const now = new Date().toISOString();
    const record: TransactionRecord = {
      id: `tx-${randomUUID().slice(0, 8)}`,
      harvestId: data.harvestId,
      buyerId: data.buyerId,
      offerId: data.offerId,
      agreedPrice: data.agreedPrice,
      actualReceivedKg: data.actualReceivedKg,
      status: 'pending',
      createdAt: now,
    };
    getBackendState().transactions.unshift(record);
    return record;
  }

  async getActivityEvents(harvestId?: string): Promise<TimelineEvent[]> {
    const list = getBackendState().timeline;
    return harvestId ? list.filter((e) => e.harvestId === harvestId) : [...list];
  }

  async logActivityEvent(event: {
    harvestId?: string;
    actorId?: string;
    eventType: string;
    details?: Record<string, unknown>;
  }): Promise<TimelineEvent> {
    const now = new Date().toISOString();
    const record: TimelineEvent = {
      id: `event-${randomUUID().slice(0, 8)}`,
      harvestId: event.harvestId || '',
      actorId: event.actorId || 'system-orchestrator',
      type: event.eventType,
      detail: event.details ? JSON.stringify(event.details) : '',
      createdAt: now,
    };
    getBackendState().timeline.unshift(record);
    return record;
  }

  async getExceptions(filter?: { resolved?: boolean; harvestId?: string }): Promise<WorkflowException[]> {
    let list = [...inMemoryExceptions];
    if (filter?.harvestId) list = list.filter((e) => e.harvestId === filter.harvestId);
    if (filter?.resolved !== undefined) list = list.filter((e) => e.resolved === filter.resolved);
    return list;
  }

  async createException(data: Omit<WorkflowException, 'id' | 'createdAt' | 'resolved'>): Promise<WorkflowException> {
    const record: WorkflowException = {
      ...data,
      id: `exc-${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    inMemoryExceptions.unshift(record);
    return record;
  }

  async resolveException(id: string, actionTaken: string): Promise<WorkflowException> {
    const item = inMemoryExceptions.find((e) => e.id === id);
    if (!item) throw new Error(`Exception ${id} not found.`);
    item.resolved = true;
    item.resolvedAt = new Date().toISOString();
    item.actionTaken = actionTaken;
    return item;
  }
}

/**
 * Supabase Database Adapter
 * Queries and updates live PostgreSQL tables via Supabase
 */
export class SupabaseDatabaseAdapter implements IDatabaseAdapter {
  readonly mode = 'supabase' as const;

  private getClient() {
    const client = createSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase client not configured. Ensure NEXT_PUBLIC_SUPABASE_URL and key are provided.');
    }
    return client;
  }

  async getHarvests(filter?: { farmerId?: string; status?: string }): Promise<HarvestRecord[]> {
    const client = this.getClient();
    let query = client.from('harvests').select('*').order('created_at', { ascending: false });
    if (filter?.farmerId) query = query.eq('farmer_id', filter.farmerId);
    if (filter?.status) query = query.eq('status', filter.status);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch harvests: ${error.message}`);

    return (data || []).map((row) => ({
      id: row.id,
      farmerId: row.farmer_id,
      crop: row.crop,
      quantity: Number(row.quantity),
      unit: row.unit,
      harvestDate: row.harvest_date,
      location: row.location,
      handlingNotes: row.handling_notes ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getHarvestById(id: string): Promise<HarvestRecord | null> {
    const client = this.getClient();
    const { data, error } = await client.from('harvests').select('*').eq('id', id).single();
    if (error || !data) return null;

    return {
      id: data.id,
      farmerId: data.farmer_id,
      crop: data.crop,
      quantity: Number(data.quantity),
      unit: data.unit,
      harvestDate: data.harvest_date,
      location: data.location,
      handlingNotes: data.handling_notes ?? undefined,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createHarvest(data: Omit<HarvestRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HarvestRecord> {
    const client = this.getClient();
    const { data: inserted, error } = await client
      .from('harvests')
      .insert({
        farmer_id: data.farmerId,
        crop: data.crop,
        quantity: data.quantity,
        unit: data.unit,
        harvest_date: data.harvestDate,
        location: data.location,
        handling_notes: data.handlingNotes,
        status: data.status,
        demo_data: false,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create harvest: ${error.message}`);

    return {
      id: inserted.id,
      farmerId: inserted.farmer_id,
      crop: inserted.crop,
      quantity: Number(inserted.quantity),
      unit: inserted.unit,
      harvestDate: inserted.harvest_date,
      location: inserted.location,
      handlingNotes: inserted.handling_notes ?? undefined,
      status: inserted.status,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
    };
  }

  async updateHarvest(id: string, patch: Partial<HarvestRecord>): Promise<HarvestRecord> {
    const client = this.getClient();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.crop) updatePayload.crop = patch.crop;
    if (patch.quantity !== undefined) updatePayload.quantity = patch.quantity;
    if (patch.unit) updatePayload.unit = patch.unit;
    if (patch.status) updatePayload.status = patch.status;
    if (patch.handlingNotes !== undefined) updatePayload.handling_notes = patch.handlingNotes;
    if (patch.location) updatePayload.location = patch.location;

    const { data, error } = await client
      .from('harvests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update harvest: ${error.message}`);

    return {
      id: data.id,
      farmerId: data.farmer_id,
      crop: data.crop,
      quantity: Number(data.quantity),
      unit: data.unit,
      harvestDate: data.harvest_date,
      location: data.location,
      handlingNotes: data.handling_notes ?? undefined,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getAssessments(harvestId?: string): Promise<AssessmentRecord[]> {
    const client = this.getClient();
    let query = client.from('assessments').select('*').order('created_at', { ascending: false });
    if (harvestId) query = query.eq('harvest_id', harvestId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch assessments: ${error.message}`);

    return (data || []).map((row) => ({
      id: row.id,
      harvestId: row.harvest_id,
      crop: row.crop,
      confidence: Number(row.confidence),
      observations: row.observations || [],
      defects: row.defects || [],
      limitations: row.limitations || [],
      recommendations: [],
      provider: row.provider,
      createdAt: row.created_at,
    }));
  }

  async saveAssessment(assessment: AssessmentRecord): Promise<AssessmentRecord> {
    const client = this.getClient();
    const { data, error } = await client
      .from('assessments')
      .upsert(
        {
          harvest_id: assessment.harvestId,
          crop: assessment.crop,
          confidence: assessment.confidence,
          observations: assessment.observations,
          defects: assessment.defects,
          limitations: assessment.limitations,
          provider: assessment.provider,
        },
        { onConflict: 'harvest_id' },
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to save assessment: ${error.message}`);

    return {
      ...assessment,
      id: data.id,
      createdAt: data.created_at,
    };
  }

  async getFacilities(): Promise<DemoFacility[]> {
    const client = this.getClient();
    const { data, error } = await client.from('facilities').select('*');
    if (error || !data || data.length === 0) {
      return [...demoFacilities];
    }

    return data.map((f) => ({
      id: f.id,
      name: f.name,
      locality: f.location,
      county: f.county as 'Kisii' | 'Nyamira',
      facilityType: f.type as 'cold_storage' | 'ambient' | 'drying',
      storageTypes: [f.type === 'cold_storage' ? 'cold' : f.type === 'drying' ? 'dry' : 'ambient'],
      acceptedCommodities: ['Tomatoes', 'Avocados', 'Bananas'],
      description: 'Verified regional cold chain hub.',
      availableCapacityKg: 1000,
      pricePerUnit: 3.2,
      priceUnit: 'kg',
      pricePeriod: 'day',
      temperatureC: 12.0,
      humidityPercent: 85,
      readingObservedAt: f.created_at,
      imageUrl: f.type === 'cold_storage' ? '/storage/cold-store.jpg' : f.type === 'drying' ? '/storage/dry-handling.jpg' : '/storage/ambient-store.jpg',
      imageAlt: `${f.name} facility`,
      source: 'provider_confirmed',
      verificationStatus: 'verified',
    }));
  }

  async getCapacitySlots(facilityId?: string): Promise<CapacitySlotRecord[]> {
    const client = this.getClient();
    let query = client.from('capacity_slots').select('*');
    if (facilityId) query = query.eq('facility_id', facilityId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch capacity slots: ${error.message}`);

    return (data || []).map((slot) => ({
      id: slot.id,
      facilityId: slot.facility_id,
      capacityKg: Number(slot.capacity_kg),
      reservedKg: Number(slot.reserved_kg),
      windowStart: slot.window_start,
      windowEnd: slot.window_end,
    }));
  }

  async getReservations(filter?: { harvestId?: string; facilityId?: string }): Promise<ReservationRecord[]> {
    const client = this.getClient();
    let query = client.from('reservations').select('*');
    if (filter?.harvestId) query = query.eq('harvest_id', filter.harvestId);
    if (filter?.facilityId) query = query.eq('facility_id', filter.facilityId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch reservations: ${error.message}`);

    return (data || []).map((r) => ({
      id: r.id,
      harvestId: r.harvest_id,
      facilityId: r.facility_id,
      quantityKg: Number(r.quantity_kg),
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  async createReservation(data: {
    harvestId: string;
    facilityId: string;
    quantityKg: number;
    capacitySlotId?: string;
  }): Promise<ReservationRecord> {
    const client = this.getClient();
    const { data: inserted, error } = await client
      .from('reservations')
      .insert({
        harvest_id: data.harvestId,
        facility_id: data.facilityId,
        quantity_kg: data.quantityKg,
        capacity_slot_id: data.capacitySlotId || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create reservation: ${error.message}`);

    return {
      id: inserted.id,
      harvestId: inserted.harvest_id,
      facilityId: inserted.facility_id,
      quantityKg: Number(inserted.quantity_kg),
      status: inserted.status,
      createdAt: inserted.created_at,
    };
  }

  async updateReservationStatus(id: string, status: ReservationRecord['status']): Promise<ReservationRecord> {
    const client = this.getClient();
    const { data, error } = await client
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update reservation: ${error.message}`);

    return {
      id: data.id,
      harvestId: data.harvest_id,
      facilityId: data.facility_id,
      quantityKg: Number(data.quantity_kg),
      status: data.status,
      createdAt: data.created_at,
    };
  }

  async getTransportJobs(filter?: { harvestId?: string; providerId?: string }): Promise<TransportJobRecord[]> {
    const client = this.getClient();
    let query = client.from('transport_jobs').select('*');
    if (filter?.harvestId) query = query.eq('harvest_id', filter.harvestId);
    if (filter?.providerId) query = query.eq('provider_id', filter.providerId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch transport jobs: ${error.message}`);

    return (data || []).map((t) => ({
      id: t.id,
      harvestId: t.harvest_id,
      providerId: t.provider_id || '',
      origin: t.origin,
      destination: t.destination,
      status: t.status,
      createdAt: t.created_at,
    }));
  }

  async createTransportJob(data: {
    harvestId: string;
    providerId: string;
    origin: string;
    destination: string;
  }): Promise<TransportJobRecord> {
    const client = this.getClient();
    const { data: inserted, error } = await client
      .from('transport_jobs')
      .insert({
        harvest_id: data.harvestId,
        provider_id: data.providerId || null,
        origin: data.origin,
        destination: data.destination,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create transport job: ${error.message}`);

    return {
      id: inserted.id,
      harvestId: inserted.harvest_id,
      providerId: inserted.provider_id || '',
      origin: inserted.origin,
      destination: inserted.destination,
      status: inserted.status,
      createdAt: inserted.created_at,
    };
  }

  async updateTransportStatus(id: string, status: TransportJobRecord['status']): Promise<TransportJobRecord> {
    const client = this.getClient();
    const { data, error } = await client
      .from('transport_jobs')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update transport job: ${error.message}`);

    return {
      id: data.id,
      harvestId: data.harvest_id,
      providerId: data.provider_id || '',
      origin: data.origin,
      destination: data.destination,
      status: data.status,
      createdAt: data.created_at,
    };
  }

  async getOffers(filter?: { harvestId?: string; buyerId?: string }): Promise<OfferRecord[]> {
    const client = this.getClient();
    let query = client.from('offers').select('*');
    if (filter?.harvestId) query = query.eq('harvest_id', filter.harvestId);
    if (filter?.buyerId) query = query.eq('buyer_id', filter.buyerId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch offers: ${error.message}`);

    return (data || []).map((o) => ({
      id: o.id,
      harvestId: o.harvest_id,
      buyerId: o.buyer_id,
      pricePerKg: Number(o.price_per_kg),
      quantityKg: 0,
      status: o.status,
      source: o.source,
      createdAt: o.created_at,
    }));
  }

  async createOffer(data: {
    harvestId: string;
    buyerId: string;
    pricePerKg: number;
    quantityKg: number;
    source?: OfferRecord['source'];
    expiresAt?: string;
  }): Promise<OfferRecord> {
    const client = this.getClient();
    const { data: inserted, error } = await client
      .from('offers')
      .insert({
        harvest_id: data.harvestId,
        buyer_id: data.buyerId,
        price_per_kg: data.pricePerKg,
        source: data.source || 'manually_entered',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create offer: ${error.message}`);

    return {
      id: inserted.id,
      harvestId: inserted.harvest_id,
      buyerId: inserted.buyer_id,
      pricePerKg: Number(inserted.price_per_kg),
      quantityKg: data.quantityKg,
      status: inserted.status,
      source: inserted.source,
      createdAt: inserted.created_at,
    };
  }

  async updateOfferStatus(id: string, status: OfferRecord['status']): Promise<OfferRecord> {
    const client = this.getClient();
    const { data, error } = await client
      .from('offers')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update offer: ${error.message}`);

    return {
      id: data.id,
      harvestId: data.harvest_id,
      buyerId: data.buyer_id,
      pricePerKg: Number(data.price_per_kg),
      quantityKg: 0,
      status: data.status,
      source: data.source,
      createdAt: data.created_at,
    };
  }

  async getInventoryBatches(harvestId?: string): Promise<InventoryBatchRecord[]> {
    const client = this.getClient();
    let query = client.from('inventory_batches').select('*');
    if (harvestId) query = query.eq('harvest_id', harvestId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch inventory batches: ${error.message}`);

    return (data || []).map((b) => ({
      id: b.id,
      harvestId: b.harvest_id,
      actualReceivedKg: Number(b.actual_received_kg),
      receivedAt: b.received_at,
      status: b.status,
    }));
  }

  async createInventoryBatch(data: {
    harvestId: string;
    actualReceivedKg: number;
    status?: InventoryBatchRecord['status'];
  }): Promise<InventoryBatchRecord> {
    const client = this.getClient();
    const { data: inserted, error } = await client
      .from('inventory_batches')
      .insert({
        harvest_id: data.harvestId,
        actual_received_kg: data.actualReceivedKg,
        status: data.status || 'received',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create inventory batch: ${error.message}`);

    return {
      id: inserted.id,
      harvestId: inserted.harvest_id,
      actualReceivedKg: Number(inserted.actual_received_kg),
      receivedAt: inserted.received_at,
      status: inserted.status,
    };
  }

  async getTransactions(filter?: { harvestId?: string; buyerId?: string }): Promise<TransactionRecord[]> {
    const client = this.getClient();
    let query = client.from('transactions').select('*');
    if (filter?.harvestId) query = query.eq('harvest_id', filter.harvestId);
    if (filter?.buyerId) query = query.eq('buyer_id', filter.buyerId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);

    return (data || []).map((tx) => ({
      id: tx.id,
      harvestId: tx.harvest_id,
      buyerId: tx.buyer_id,
      offerId: tx.offer_id || '',
      agreedPrice: Number(tx.agreed_price || 0),
      actualReceivedKg: Number(tx.actual_received_kg || 0),
      status: tx.status,
      createdAt: tx.created_at,
    }));
  }

  async createTransaction(data: {
    harvestId: string;
    buyerId: string;
    offerId: string;
    agreedPrice: number;
    actualReceivedKg: number;
  }): Promise<TransactionRecord> {
    const client = this.getClient();
    const { data: inserted, error } = await client
      .from('transactions')
      .insert({
        harvest_id: data.harvestId,
        buyer_id: data.buyerId,
        offer_id: data.offerId || null,
        agreed_price: data.agreedPrice,
        actual_received_kg: data.actualReceivedKg,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create transaction: ${error.message}`);

    return {
      id: inserted.id,
      harvestId: inserted.harvest_id,
      buyerId: inserted.buyer_id,
      offerId: inserted.offer_id || '',
      agreedPrice: Number(inserted.agreed_price),
      actualReceivedKg: Number(inserted.actual_received_kg),
      status: inserted.status,
      createdAt: inserted.created_at,
    };
  }

  async getActivityEvents(harvestId?: string): Promise<TimelineEvent[]> {
    const client = this.getClient();
    let query = client.from('activity_events').select('*').order('created_at', { ascending: false });
    if (harvestId) query = query.eq('harvest_id', harvestId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch activity events: ${error.message}`);

    return (data || []).map((e) => ({
      id: e.id,
      harvestId: e.harvest_id || '',
      actorId: e.actor_id || 'system',
      type: e.event_type,
      detail: typeof e.details === 'object' ? JSON.stringify(e.details) : String(e.details || ''),
      createdAt: e.created_at,
    }));
  }

  async logActivityEvent(event: {
    harvestId?: string;
    actorId?: string;
    eventType: string;
    details?: Record<string, unknown>;
  }): Promise<TimelineEvent> {
    const client = this.getClient();
    const { data: inserted, error } = await client
      .from('activity_events')
      .insert({
        harvest_id: event.harvestId || null,
        actor_id: event.actorId || null,
        event_type: event.eventType,
        details: event.details || {},
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to log activity event: ${error.message}`);

    return {
      id: inserted.id,
      harvestId: inserted.harvest_id || '',
      actorId: inserted.actor_id || 'system',
      type: inserted.event_type,
      detail: JSON.stringify(inserted.details),
      createdAt: inserted.created_at,
    };
  }

  async getExceptions(filter?: { resolved?: boolean; harvestId?: string }): Promise<WorkflowException[]> {
    const client = this.getClient();
    let query = client
      .from('activity_events')
      .select('*')
      .eq('event_type', 'workflow_exception')
      .order('created_at', { ascending: false });

    if (filter?.harvestId) query = query.eq('harvest_id', filter.harvestId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch workflow exceptions: ${error.message}`);

    const exceptions: WorkflowException[] = (data || []).map((e) => {
      const details = (e.details as Record<string, unknown>) || {};
      return {
        id: e.id,
        harvestId: e.harvest_id || undefined,
        severity: (details.severity as WorkflowException['severity']) || 'medium',
        type: String(details.type || 'operational_anomaly'),
        title: String(details.title || 'Operational Anomaly'),
        description: String(details.description || ''),
        suggestedAction: String(details.suggestedAction || 'Review operations'),
        resolved: Boolean(details.resolved),
        resolvedAt: details.resolvedAt ? String(details.resolvedAt) : undefined,
        actionTaken: details.actionTaken ? String(details.actionTaken) : undefined,
        createdAt: e.created_at,
      };
    });

    if (filter?.resolved !== undefined) {
      return exceptions.filter((e) => e.resolved === filter.resolved);
    }
    return exceptions;
  }

  async createException(data: Omit<WorkflowException, 'id' | 'createdAt' | 'resolved'>): Promise<WorkflowException> {
    const client = this.getClient();
    const { data: inserted, error } = await client
      .from('activity_events')
      .insert({
        harvest_id: data.harvestId || null,
        event_type: 'workflow_exception',
        details: {
          severity: data.severity,
          type: data.type,
          title: data.title,
          description: data.description,
          suggestedAction: data.suggestedAction,
          resolved: false,
        },
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create exception: ${error.message}`);

    return {
      ...data,
      id: inserted.id,
      resolved: false,
      createdAt: inserted.created_at,
    };
  }

  async resolveException(id: string, actionTaken: string): Promise<WorkflowException> {
    const client = this.getClient();
    const { data: existing, error: fetchErr } = await client
      .from('activity_events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) throw new Error(`Exception ${id} not found.`);

    const now = new Date().toISOString();
    const currentDetails = (existing.details as Record<string, unknown>) || {};
    const updatedDetails: Record<string, unknown> = {
      ...currentDetails,
      resolved: true,
      resolvedAt: now,
      actionTaken,
    };

    const { data: updated, error: updateErr } = await client
      .from('activity_events')
      .update({ details: updatedDetails })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw new Error(`Failed to resolve exception: ${updateErr.message}`);

    return {
      id: updated.id,
      harvestId: updated.harvest_id || undefined,
      severity: (updatedDetails.severity as WorkflowException['severity']) || 'medium',
      type: String(updatedDetails.type || ''),
      title: String(updatedDetails.title || ''),
      description: String(updatedDetails.description || ''),
      suggestedAction: String(updatedDetails.suggestedAction || ''),
      resolved: true,
      resolvedAt: now,
      actionTaken,
      createdAt: updated.created_at,
    };
  }
}

// Global singleton instances
let defaultAdapter: IDatabaseAdapter | null = null;

export function getDatabaseAdapter(): IDatabaseAdapter {
  if (defaultAdapter) {
    return defaultAdapter;
  }

  if (hasSupabaseConfig && env.NEXT_PUBLIC_SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    try {
      defaultAdapter = new SupabaseDatabaseAdapter();
      return defaultAdapter;
    } catch {
      defaultAdapter = new MemoryDatabaseAdapter();
      return defaultAdapter;
    }
  }

  defaultAdapter = new MemoryDatabaseAdapter();
  return defaultAdapter;
}

export function resetDatabaseAdapter() {
  defaultAdapter = null;
}
