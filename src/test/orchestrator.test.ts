import { beforeEach, describe, expect, it } from 'vitest';
import { assessHarvest } from '@/lib/ai';
import { resolveAuthContext } from '@/lib/auth-server';
import {
  MemoryDatabaseAdapter,
  resetDatabaseAdapter,
} from '@/lib/database-adapter';
import {
  AgenticOrchestrator,
  CapacityReservationService,
  DeliveryMonitoringService,
  InventoryReconciliationService,
  PreservationDecisionService,
  StorageMatchingAgent,
  SupervisorExceptionAgent,
  TransportDispatchAgent,
} from '@/lib/orchestrator';

describe('Agentic AI & Backend Suite', () => {
  let db: MemoryDatabaseAdapter;
  let orchestrator: AgenticOrchestrator;
  let dispatch: TransportDispatchAgent;
  let reconciliation: InventoryReconciliationService;

  beforeEach(() => {
    resetDatabaseAdapter();
    db = new MemoryDatabaseAdapter();
    orchestrator = new AgenticOrchestrator(db);
    dispatch = new TransportDispatchAgent(db);
    reconciliation = new InventoryReconciliationService(db);
  });

  describe('Crop Assessment Agent (AI & Fallback)', () => {
    it('assesses harvest with valid schema and confidence score', async () => {
      const result = await assessHarvest({
        crop: 'Tomato',
        quantity: 300,
        unit: 'kg',
        location: 'Kisii Town',
        handlingNotes: 'Firm, uniform size, harvested at sunrise.',
      });

      expect(result.crop).toBe('Tomato');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.observations.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].feasible).toBe(true);
      expect(result.provider).toBeDefined();
    });

    it('handles unexpected or empty inputs gracefully', async () => {
      const result = await assessHarvest({});
      expect(result.crop).toBe('Tomato');
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Preservation Decision Service', () => {
    const service = new PreservationDecisionService();

    it('computes exact net proceeds for all 3 avenues with deductions', () => {
      const harvest = {
        id: 'test-h-1',
        farmerId: 'farmer-1',
        crop: 'Tomato',
        quantity: 500,
        unit: 'kg' as const,
        harvestDate: new Date().toISOString(),
        location: 'Kisii County',
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = service.evaluate(harvest, 50);

      expect(result.harvestId).toBe('test-h-1');
      expect(result.recommendations).toHaveLength(3);

      const immediate = result.recommendations.find((r) => r.type === 'immediate_sale')!;
      expect(immediate.grossKES).toBe(25000); // 500 * 50
      expect(immediate.estimatedNetKES).toBe(24250); // 25000 - (250 transport + 500 platform fee)

      const storage = result.recommendations.find((r) => r.type === 'storage')!;
      expect(storage.grossKES).toBeGreaterThan(immediate.grossKES);
      expect(storage.totalDeductionsKES).toBeGreaterThan(immediate.totalDeductionsKES);

      const drying = result.recommendations.find((r) => r.type === 'drying')!;
      expect(drying.feasible).toBe(true);
    });
  });

  describe('Storage Matching & Capacity Conservation', () => {
    it('matches compatible cold chain facilities in Kisii/Nyamira', async () => {
      const matching = new StorageMatchingAgent(db);
      const harvest = {
        id: 'test-h-2',
        farmerId: 'farmer-1',
        crop: 'Tomatoes',
        quantity: 400,
        unit: 'kg' as const,
        harvestDate: new Date().toISOString(),
        location: 'Kisii',
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const facilities = await matching.findCompatibleFacilities(harvest);
      expect(facilities.length).toBeGreaterThanOrEqual(1);
      expect(facilities.some((f) => f.name.includes('Cold Store'))).toBe(true);
    });

    it('rejects reservation and raises supervisor exception if capacity is exceeded', async () => {
      const capacityService = new CapacityReservationService(db);

      // Facility facility-01 has 840kg available
      await expect(
        capacityService.reserveCapacity('h-exceeded', 'facility-01', 9999, 'farmer-1'),
      ).rejects.toThrow(/Capacity exceeded/);

      const exceptions = await db.getExceptions({ resolved: false });
      expect(exceptions.some((e) => e.type === 'CAPACITY_EXCEEDED')).toBe(true);
    });

    it('succeeds when reservation is within available capacity limits', async () => {
      const capacityService = new CapacityReservationService(db);
      const reservation = await capacityService.reserveCapacity('h-ok', 'facility-01', 200, 'farmer-1');

      expect(reservation.id).toBeDefined();
      expect(reservation.quantityKg).toBe(200);
      expect(reservation.status).toBe('pending');
    });
  });

  describe('Transport Dispatch & Delivery Monitoring', () => {
    it('assigns boda boda for <= 150kg loads', () => {
      const res = dispatch.getOptimalVehicleClass(120);
      expect(res.vehicleType).toBe('boda_boda');
    });

    it('assigns probox / pickup for 150-1000kg loads', () => {
      const res = dispatch.getOptimalVehicleClass(650);
      expect(res.vehicleType).toBe('probox');
    });

    it('assigns canter truck for > 1000kg loads', () => {
      const res = dispatch.getOptimalVehicleClass(1500);
      expect(res.vehicleType).toBe('canter_truck');
    });

    it('flags delivery SLA breach if in transit exceeds threshold', async () => {
      const job = await db.createTransportJob({
        harvestId: 'h-sla',
        providerId: 'provider-1',
        origin: 'Suneka',
        destination: 'Kisii Cold Store',
      });
      await db.updateTransportStatus(job.id, 'in_transit');

      // Mock old createdAt (4 hours ago)
      const fourHoursAgo = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
      const rawJob = (await db.getTransportJobs()).find((j) => j.id === job.id)!;
      rawJob.createdAt = fourHoursAgo;

      const monitor = new DeliveryMonitoringService(db);
      const check = await monitor.checkDeliverySLA(job.id, 3);

      expect(check.onSchedule).toBe(false);
      expect(check.elapsedHours).toBeGreaterThanOrEqual(4);

      const exceptions = await db.getExceptions({ resolved: false });
      expect(exceptions.some((e) => e.type === 'TRANSIT_DELAY')).toBe(true);
    });
  });

  describe('Inventory Reconciliation (5% Discrepancy Gate)', () => {
    it('accepts intake weight within 5% tolerance', async () => {
      const harvest = await db.createHarvest({
        farmerId: 'farmer-1',
        crop: 'Tomato',
        quantity: 100,
        unit: 'kg',
        harvestDate: new Date().toISOString(),
        location: 'Kisii',
        status: 'draft',
      });

      const result = await reconciliation.verifyIntakeWeight(harvest.id, 98, 'operator-1');
      expect(result.status).toBe('accepted');
      expect(result.variancePercent).toBe(2);
    });

    it('trips supervisor exception gate when discrepancy exceeds 5%', async () => {
      const harvest = await db.createHarvest({
        farmerId: 'farmer-1',
        crop: 'Tomato',
        quantity: 100,
        unit: 'kg',
        harvestDate: new Date().toISOString(),
        location: 'Kisii',
        status: 'draft',
      });

      // Dispatched 100kg, intake measured 92kg (8% loss)
      const result = await reconciliation.verifyIntakeWeight(harvest.id, 92, 'operator-1');
      expect(result.status).toBe('discrepancy_flagged');
      expect(result.variancePercent).toBe(8);

      const exceptions = await db.getExceptions({ resolved: false });
      expect(exceptions.some((e) => e.type === 'WEIGHT_DISCREPANCY')).toBe(true);
    });
  });

  describe('Supervisor Exception Agent & Remediation', () => {
    it('executes one-click remediation and marks exception resolved', async () => {
      const supervisor = new SupervisorExceptionAgent(db);

      const created = await db.createException({
        harvestId: 'h-dispute',
        severity: 'high',
        type: 'WEIGHT_DISCREPANCY',
        title: 'Intake weight mismatch',
        description: 'Scale tare discrepancy detected.',
        suggestedAction: 'Recalibrate tare and adjust weight',
      });

      const remediated = await supervisor.remediate(
        created.id,
        'adjust_weight',
        { adjustedWeightKg: 97.5, approvedBy: 'ops_admin' },
        'admin-user',
      );

      expect(remediated.resolved).toBe(true);
      expect(remediated.actionTaken).toContain('adjust_weight');

      const active = await supervisor.getActiveExceptions();
      expect(active.some((e) => e.id === created.id)).toBe(false);
    });
  });

  describe('Dual Auth Context Resolver', () => {
    it('resolves explicit request headers for tests and microservices', async () => {
      const fakeRequest = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-user-id': 'custom-buyer-id',
          'x-user-role': 'buyer',
        },
      });

      const auth = await resolveAuthContext(fakeRequest);
      expect(auth.userId).toBe('custom-buyer-id');
      expect(auth.role).toBe('buyer');
    });

    it('defaults gracefully to demo farmer context when unauthenticated', async () => {
      const auth = await resolveAuthContext();
      expect(auth.userId).toBe('user-farmer-demo');
      expect(auth.role).toBe('farmer');
    });
  });

  describe('End-to-End Orchestrator Pipeline', () => {
    it('evaluates entire harvest lifecycle in a single cycle', async () => {
      const harvest = await db.createHarvest({
        farmerId: 'farmer-e2e',
        crop: 'Tomato',
        quantity: 250,
        unit: 'kg',
        harvestDate: new Date().toISOString(),
        location: 'Kisii County',
        status: 'draft',
      });

      const evaluation = await orchestrator.evaluateWorkflow(harvest.id, {
        userId: 'farmer-e2e',
        role: 'farmer',
      });

      expect(evaluation.harvest.id).toBe(harvest.id);
      expect(evaluation.assessment.crop).toBe('Tomato');
      expect(evaluation.preservationOptions.recommendations.length).toBe(3);
      expect(evaluation.matchingFacilities.length).toBeGreaterThanOrEqual(1);
      expect(evaluation.matchingOffers.length).toBeGreaterThanOrEqual(1);

      const events = await db.getActivityEvents(harvest.id);
      expect(events.length).toBeGreaterThanOrEqual(2);
    });
  });
});
