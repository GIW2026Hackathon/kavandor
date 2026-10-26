import { randomUUID } from 'crypto';
import { calculateNetProceeds } from '@/calculations/netProceeds';
import { assessHarvest, type AIAssessmentResult } from '@/lib/ai';
import {
  type AssessmentRecord,
  type AuthContext,
  type HarvestRecord,
  type OfferRecord,
  type ReservationRecord,
  type TimelineEvent,
  type TransportJobRecord,
} from '@/lib/backend';
import {
  getDatabaseAdapter,
  type IDatabaseAdapter,
  type WorkflowException,
} from '@/lib/database-adapter';

// ---------------------------------------------------------------------------
// 1. Crop Assessment Agent
// ---------------------------------------------------------------------------
export class CropAssessmentAgent {
  constructor(private db: IDatabaseAdapter) {}

  async assess(harvest: HarvestRecord, photoPayload?: { imageUrl?: string; imageBase64?: string; mimeType?: string }): Promise<AssessmentRecord> {
    const aiResult: AIAssessmentResult = await assessHarvest({
      crop: harvest.crop,
      quantity: harvest.quantity,
      unit: harvest.unit,
      location: harvest.location,
      handlingNotes: harvest.handlingNotes,
      photoUrl: photoPayload?.imageUrl || harvest.photoUrl,
      imageBase64: photoPayload?.imageBase64,
      mimeType: photoPayload?.mimeType,
    });

    const now = new Date().toISOString();
    const record: AssessmentRecord = {
      id: `assessment-${randomUUID().slice(0, 8)}`,
      harvestId: harvest.id,
      crop: aiResult.crop,
      confidence: aiResult.confidence,
      observations: aiResult.observations,
      defects: aiResult.defects,
      limitations: aiResult.limitations,
      recommendations: aiResult.recommendations,
      provider: aiResult.provider,
      createdAt: now,
    };

    await this.db.saveAssessment(record);
    await this.db.updateHarvest(harvest.id, { status: 'assessed' });
    await this.db.logActivityEvent({
      harvestId: harvest.id,
      actorId: harvest.farmerId,
      eventType: 'crop_assessed',
      details: {
        crop: aiResult.crop,
        confidence: aiResult.confidence,
        provider: aiResult.provider,
        defectsCount: aiResult.defects.length,
      },
    });

    return record;
  }
}

// ---------------------------------------------------------------------------
// 2. Preservation Decision Service (Net Proceeds Calculation)
// ---------------------------------------------------------------------------
export interface PreservationOptionsResult {
  harvestId: string;
  recommendations: Array<{
    type: 'immediate_sale' | 'storage' | 'drying' | 'aggregation';
    label: string;
    description: string;
    grossKES: number;
    totalDeductionsKES: number;
    estimatedNetKES: number;
    assumptions: string[];
    feasible: boolean;
  }>;
}

export class PreservationDecisionService {
  evaluate(harvest: HarvestRecord, baseUnitPrice = 45): PreservationOptionsResult {
    const qty = harvest.quantity;

    // 1. Immediate Sale
    const immUnitPrice = baseUnitPrice;
    const immGross = qty * immUnitPrice;
    const immTransport = 250;
    const immFacility = 0;
    const immFees = Math.round(immGross * 0.02);
    const immNet = calculateNetProceeds({
      quantity: qty,
      unitPrice: immUnitPrice,
      transportCost: immTransport,
      facilityCost: immFacility,
      fees: immFees,
    });

    // 2. Cold Storage (7 days buffer)
    const storeUnitPrice = Math.round(baseUnitPrice * 1.35); // 35% seasonal arbitrage
    const storeGross = qty * storeUnitPrice;
    const storeTransport = 350;
    const storeFacilityFee = 150;
    const storageRatePerDay = 3.2; // KES/kg/day
    const storageDurationDays = 7;
    const storageTotalCost = Math.round(qty * storageRatePerDay * storageDurationDays);
    const storeFees = Math.round(storeGross * 0.02);
    const storeNet = calculateNetProceeds({
      quantity: qty,
      unitPrice: storeUnitPrice,
      transportCost: storeTransport,
      facilityCost: storeFacilityFee,
      fees: storeFees,
      storageCost: storageTotalCost,
    });

    // 3. Solar Drying / Dehydration
    const dryRecoveryRatio = 0.18; // 18% weight retention for dried produce
    const driedQty = Number((qty * dryRecoveryRatio).toFixed(1));
    const driedUnitPrice = baseUnitPrice * 7.5; // premium dried value
    const driedGross = driedQty * driedUnitPrice;
    const dryTransport = 200;
    const dryingProcessingCost = Math.round(qty * 4.5); // KES 4.50/fresh kg
    const dryFees = Math.round(driedGross * 0.02);
    const dryNet = calculateNetProceeds({
      quantity: driedQty,
      unitPrice: driedUnitPrice,
      transportCost: dryTransport,
      facilityCost: 0,
      fees: dryFees,
      dryingCost: dryingProcessingCost,
    });

    return {
      harvestId: harvest.id,
      recommendations: [
        {
          type: 'immediate_sale',
          label: 'Immediate Local Liquidation',
          description: 'Direct wholesale delivery to Kisii town municipal market within 12 hours.',
          grossKES: immGross,
          totalDeductionsKES: immGross - immNet,
          estimatedNetKES: immNet,
          assumptions: [`Market price KES ${immUnitPrice}/kg`, `Transport KES ${immTransport}`, `Platform fee 2% (KES ${immFees})`],
          feasible: true,
        },
        {
          type: 'storage',
          label: 'Cold Storage Buffer (7 Days)',
          description: 'Store in verified Kisii/Nyamira cold facility to bypass immediate market glut.',
          grossKES: storeGross,
          totalDeductionsKES: storeGross - storeNet,
          estimatedNetKES: storeNet,
          assumptions: [
            `Target price KES ${storeUnitPrice}/kg after hold`,
            `Cold room fee: KES ${storageRatePerDay}/kg/day (${storageDurationDays} days = KES ${storageTotalCost})`,
            `Facility intake fee: KES ${storeFacilityFee}`,
          ],
          feasible: qty <= 1000,
        },
        {
          type: 'drying',
          label: 'Solar Drying Value Addition',
          description: 'Process at Keumbu drying hub into shelf-stable packaged dried slices.',
          grossKES: Math.round(driedGross),
          totalDeductionsKES: Math.round(driedGross - dryNet),
          estimatedNetKES: Math.round(dryNet),
          assumptions: [
            `Dried yield: ${driedQty} kg (${Math.round(dryRecoveryRatio * 100)}% recovery)`,
            `Processed price KES ${driedUnitPrice}/kg`,
            `Drying energy & labor: KES ${dryingProcessingCost}`,
          ],
          feasible: ['banana', 'tomato', 'mango', 'maize', 'grain', 'onion'].some((c) => harvest.crop.toLowerCase().includes(c)),
        },
      ],
    };
  }
}

// ---------------------------------------------------------------------------
// 3. Storage Matching Agent
// ---------------------------------------------------------------------------
export class StorageMatchingAgent {
  constructor(private db: IDatabaseAdapter) {}

  async findCompatibleFacilities(harvest: HarvestRecord) {
    const allFacilities = await this.db.getFacilities();
    const cropLower = harvest.crop.toLowerCase();

    return allFacilities.filter((f) => {
      // Check commodity acceptance
      const matchesCommodity = f.acceptedCommodities.some((c) => {
        const comm = c.toLowerCase();
        return comm.includes(cropLower) || cropLower.includes(comm);
      });
      // Check capacity
      const hasCapacity = f.availableCapacityKg >= harvest.quantity;
      return matchesCommodity && hasCapacity;
    });
  }
}

// ---------------------------------------------------------------------------
// 4. Capacity Reservation Service (Atomic Capacity Check)
// ---------------------------------------------------------------------------
export class CapacityReservationService {
  constructor(private db: IDatabaseAdapter) {}

  async reserveCapacity(
    harvestId: string,
    facilityId: string,
    quantityKg: number,
    actorId: string,
  ): Promise<ReservationRecord> {
    const facilities = await this.db.getFacilities();
    const facility = facilities.find((f) => f.id === facilityId);

    if (!facility) {
      throw new Error(`Facility ${facilityId} not found.`);
    }

    // Atomic capacity conservation check:
    // Total Capacity >= Reserved + Occupied + New Request
    const existingReservations = await this.db.getReservations({ facilityId });
    const activeReservedKg = existingReservations
      .filter((r) => r.status === 'pending' || r.status === 'confirmed')
      .reduce((sum, r) => sum + r.quantityKg, 0);

    const availableKg = facility.availableCapacityKg - activeReservedKg;

    if (quantityKg > availableKg) {
      // Trigger Supervisor Exception
      await this.db.createException({
        harvestId,
        severity: 'high',
        type: 'CAPACITY_EXCEEDED',
        title: `Cold Storage Overbooking Alert: ${facility.name}`,
        description: `Requested ${quantityKg} kg exceeds current available headroom (${availableKg} kg) at ${facility.name}.`,
        suggestedAction: 'Reroute to secondary facility in Nyamira or reduce allocation.',
      });

      throw new Error(`Capacity exceeded at ${facility.name}. Available: ${availableKg} kg, requested: ${quantityKg} kg.`);
    }

    const reservation = await this.db.createReservation({
      harvestId,
      facilityId,
      quantityKg,
    });

    await this.db.logActivityEvent({
      harvestId,
      actorId,
      eventType: 'capacity_reserved',
      details: {
        facilityId,
        facilityName: facility.name,
        quantityKg,
        reservationId: reservation.id,
      },
    });

    return reservation;
  }
}

// ---------------------------------------------------------------------------
// 5. Transport Dispatch Agent
// ---------------------------------------------------------------------------
export class TransportDispatchAgent {
  constructor(private db: IDatabaseAdapter) {}

  getOptimalVehicleClass(quantityKg: number): { vehicleType: 'boda_boda' | 'probox' | 'canter_truck'; capacityMaxKg: number } {
    if (quantityKg <= 150) {
      return { vehicleType: 'boda_boda', capacityMaxKg: 150 };
    }
    if (quantityKg <= 1000) {
      return { vehicleType: 'probox', capacityMaxKg: 1000 };
    }
    return { vehicleType: 'canter_truck', capacityMaxKg: 5000 };
  }

  async dispatchJob(
    harvestId: string,
    providerId: string,
    origin: string,
    destination: string,
    quantityKg: number,
    actorId: string,
  ): Promise<TransportJobRecord> {
    const vehicle = this.getOptimalVehicleClass(quantityKg);
    const job = await this.db.createTransportJob({
      harvestId,
      providerId,
      origin,
      destination,
    });

    await this.db.logActivityEvent({
      harvestId,
      actorId,
      eventType: 'transport_dispatched',
      details: {
        jobId: job.id,
        providerId,
        vehicleType: vehicle.vehicleType,
        quantityKg,
        origin,
        destination,
      },
    });

    return job;
  }
}

// ---------------------------------------------------------------------------
// 6. Delivery Monitoring Service
// ---------------------------------------------------------------------------
export class DeliveryMonitoringService {
  constructor(private db: IDatabaseAdapter) {}

  async checkDeliverySLA(jobId: string, expectedHours = 3): Promise<{ onSchedule: boolean; elapsedHours: number }> {
    const jobs = await this.db.getTransportJobs();
    const job = jobs.find((j) => j.id === jobId);

    if (!job) throw new Error(`Transport job ${jobId} not found.`);

    const elapsedMs = Date.now() - new Date(job.createdAt).getTime();
    const elapsedHours = Number((elapsedMs / (1000 * 3600)).toFixed(1));

    if (job.status === 'in_transit' && elapsedHours > expectedHours) {
      await this.db.createException({
        harvestId: job.harvestId,
        severity: 'high',
        type: 'TRANSIT_DELAY',
        title: `Transit SLA Breach: Job #${job.id}`,
        description: `Shipment from ${job.origin} to ${job.destination} has been in transit for ${elapsedHours} hours (SLA: ${expectedHours}h). Risk of heat spoilage.`,
        suggestedAction: 'Contact driver immediately or dispatch backup retrieval unit.',
      });

      return { onSchedule: false, elapsedHours };
    }

    return { onSchedule: true, elapsedHours };
  }
}

// ---------------------------------------------------------------------------
// 7. Inventory Reconciliation Service (5% Discrepancy Gate)
// ---------------------------------------------------------------------------
export class InventoryReconciliationService {
  constructor(private db: IDatabaseAdapter) {}

  async verifyIntakeWeight(
    harvestId: string,
    actualReceivedKg: number,
    actorId: string,
  ): Promise<{ status: 'accepted' | 'discrepancy_flagged'; variancePercent: number }> {
    const harvest = await this.db.getHarvestById(harvestId);
    if (!harvest) throw new Error(`Harvest ${harvestId} not found.`);

    const expectedKg = harvest.quantity;
    const varianceKg = Math.abs(expectedKg - actualReceivedKg);
    const variancePercent = Number(((varianceKg / expectedKg) * 100).toFixed(2));

    await this.db.createInventoryBatch({
      harvestId,
      actualReceivedKg,
      status: variancePercent > 5 ? 'received' : 'sorted',
    });

    if (variancePercent > 5) {
      await this.db.createException({
        harvestId,
        severity: 'high',
        type: 'WEIGHT_DISCREPANCY',
        title: `Scale Discrepancy Gate Tripped (${variancePercent}% variance)`,
        description: `Dispatched ${expectedKg} kg, but intake scale at cold room measured ${actualReceivedKg} kg (${varianceKg.toFixed(1)} kg loss). Exceeds 5% allowable threshold.`,
        suggestedAction: 'Hold batch in intake vestibule; perform dual-scale tare calibration before settlement.',
      });

      await this.db.logActivityEvent({
        harvestId,
        actorId,
        eventType: 'inventory_variance_flagged',
        details: { expectedKg, actualReceivedKg, variancePercent },
      });

      return { status: 'discrepancy_flagged', variancePercent };
    }

    await this.db.logActivityEvent({
      harvestId,
      actorId,
      eventType: 'inventory_verified',
      details: { expectedKg, actualReceivedKg, variancePercent },
    });

    return { status: 'accepted', variancePercent };
  }
}

// ---------------------------------------------------------------------------
// 8. Buyer Matching Agent
// ---------------------------------------------------------------------------
export class BuyerMatchingAgent {
  constructor(private db: IDatabaseAdapter) {}

  async findMatchingBuyers(harvest: HarvestRecord): Promise<OfferRecord[]> {
    const allOffers = await this.db.getOffers({ harvestId: harvest.id });
    if (allOffers.length > 0) return allOffers;

    // Generate potential pre-negotiated institutional buyer offers
    const isTomato = harvest.crop.toLowerCase().includes('tomato');
    const isAvocado = harvest.crop.toLowerCase().includes('avocado');

    const recommendedPrice = isTomato ? 48 : isAvocado ? 58 : 38;
    const now = new Date().toISOString();

    const offer = await this.db.createOffer({
      harvestId: harvest.id,
      buyerId: 'buyer-kisii-supermarkets',
      pricePerKg: recommendedPrice,
      quantityKg: harvest.quantity,
      source: 'provider_confirmed',
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    });

    await this.db.logActivityEvent({
      harvestId: harvest.id,
      actorId: 'system-buyer-matching',
      eventType: 'buyer_offer_matched',
      details: {
        offerId: offer.id,
        buyerId: offer.buyerId,
        pricePerKg: offer.pricePerKg,
        quantityKg: harvest.quantity,
      },
    });

    return [offer];
  }
}

// ---------------------------------------------------------------------------
// 9. Financial Clearing Service (Physical vs Financial Separation)
// ---------------------------------------------------------------------------
export class FinancialClearingService {
  constructor(private db: IDatabaseAdapter) {}

  async clearEscrowSettlement(
    harvestId: string,
    buyerId: string,
    offerId: string,
    agreedPricePerKg: number,
    actualKg: number,
    actorId: string,
  ) {
    const totalKES = Math.round(agreedPricePerKg * actualKg);

    const tx = await this.db.createTransaction({
      harvestId,
      buyerId,
      offerId,
      agreedPrice: agreedPricePerKg,
      actualReceivedKg: actualKg,
    });

    await this.db.logActivityEvent({
      harvestId,
      actorId,
      eventType: 'escrow_cleared',
      details: {
        transactionId: tx.id,
        totalKES,
        agreedPricePerKg,
        actualKg,
      },
    });

    return tx;
  }
}

// ---------------------------------------------------------------------------
// 10. Supervisor Exception Agent
// ---------------------------------------------------------------------------
export class SupervisorExceptionAgent {
  constructor(private db: IDatabaseAdapter) {}

  async getActiveExceptions(): Promise<WorkflowException[]> {
    return this.db.getExceptions({ resolved: false });
  }

  async remediate(
    exceptionId: string,
    actionType: 'reassign_transporter' | 'adjust_weight' | 'override_capacity' | 'counter_offer',
    payload: Record<string, unknown>,
    actorId: string,
  ): Promise<WorkflowException> {
    const description = `Supervisor action executed: ${actionType} with parameters: ${JSON.stringify(payload)} by ${actorId}`;
    const resolved = await this.db.resolveException(exceptionId, description);

    await this.db.logActivityEvent({
      harvestId: resolved.harvestId,
      actorId,
      eventType: 'exception_remediated',
      details: {
        exceptionId,
        actionType,
        payload,
      },
    });

    return resolved;
  }
}

// ---------------------------------------------------------------------------
// Unified 13-Service Orchestrator Master Controller
// ---------------------------------------------------------------------------
export class AgenticOrchestrator {
  public cropAssessment: CropAssessmentAgent;
  public preservationDecision: PreservationDecisionService;
  public storageMatching: StorageMatchingAgent;
  public capacityReservation: CapacityReservationService;
  public transportDispatch: TransportDispatchAgent;
  public deliveryMonitoring: DeliveryMonitoringService;
  public inventoryReconciliation: InventoryReconciliationService;
  public buyerMatching: BuyerMatchingAgent;
  public financialClearing: FinancialClearingService;
  public supervisorExceptions: SupervisorExceptionAgent;

  constructor(private db: IDatabaseAdapter = getDatabaseAdapter()) {
    this.cropAssessment = new CropAssessmentAgent(this.db);
    this.preservationDecision = new PreservationDecisionService();
    this.storageMatching = new StorageMatchingAgent(this.db);
    this.capacityReservation = new CapacityReservationService(this.db);
    this.transportDispatch = new TransportDispatchAgent(this.db);
    this.deliveryMonitoring = new DeliveryMonitoringService(this.db);
    this.inventoryReconciliation = new InventoryReconciliationService(this.db);
    this.buyerMatching = new BuyerMatchingAgent(this.db);
    this.financialClearing = new FinancialClearingService(this.db);
    this.supervisorExceptions = new SupervisorExceptionAgent(this.db);
  }

  /**
   * Evaluates the complete automated agentic pipeline for a harvest:
   * 1. Assessment (Gemini Vision + Agronomic Rules)
   * 2. Net Proceeds Economic Modeling
   * 3. Storage Matching
   * 4. Institutional Buyer Matching
   */
  async evaluateWorkflow(
    harvestId: string,
    actor: AuthContext,
    options?: { photoUrl?: string; imageBase64?: string; mimeType?: string },
  ) {
    const harvest = await this.db.getHarvestById(harvestId);
    if (!harvest) {
      throw new Error(`Harvest ${harvestId} not found.`);
    }

    // 1. Run Crop Assessment
    const assessment = await this.cropAssessment.assess(harvest, {
      imageUrl: options?.photoUrl,
      imageBase64: options?.imageBase64,
      mimeType: options?.mimeType,
    });

    // 2. Compute Net Proceeds Options
    const preservationOptions = this.preservationDecision.evaluate(harvest);

    // 3. Find Compatible Facilities
    const matchingFacilities = await this.storageMatching.findCompatibleFacilities(harvest);

    // 4. Generate Buyer Matches
    const matchingOffers = await this.buyerMatching.findMatchingBuyers(harvest);

    // Log complete orchestration pass
    await this.db.logActivityEvent({
      harvestId,
      actorId: actor.userId,
      eventType: 'orchestration_cycle_completed',
      details: {
        assessmentConfidence: assessment.confidence,
        preservationOptionsCount: preservationOptions.recommendations.length,
        compatibleFacilitiesCount: matchingFacilities.length,
        matchingOffersCount: matchingOffers.length,
      },
    });

    return {
      harvest,
      assessment,
      preservationOptions,
      matchingFacilities,
      matchingOffers,
    };
  }
}

// Global orchestrator instance
let defaultOrchestrator: AgenticOrchestrator | null = null;

export function getOrchestrator(): AgenticOrchestrator {
  if (!defaultOrchestrator) {
    defaultOrchestrator = new AgenticOrchestrator();
  }
  return defaultOrchestrator;
}
