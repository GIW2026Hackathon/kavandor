import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { InventoryClient, type PendingIntakeReservation, type StoredBatchItem } from '@/components/storage/inventory-client';
import { PageHeader } from '@/components/ui/page-header';
import { resolveAuthContext } from '@/lib/auth-server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export const instant = false;

interface InventoryBatchRow {
  id: string;
  harvest_id: string;
  facility_id: string;
  reservation_id: string | null;
  actual_received_kg: number;
  discrepancy_kg: number;
  discrepancy_notes: string | null;
  status: string;
  received_at: string;
  harvests: { id: string; crop: string; quantity: number; unit: string } | null;
  facilities: { id: string; name: string; location: string; county: string } | null;
}

interface PendingReservationRow {
  id: string;
  harvest_id: string;
  facility_id: string;
  quantity_kg: number;
  requested_start_at: string;
  status: string;
  harvests: { id: string; crop: string; farmer_id: string } | null;
}

export default async function StoredProducePage() {
  const auth = await resolveAuthContext();
  const userRole = auth?.role || 'farmer';
  const admin = createSupabaseAdminClient();

  let initialBatches: StoredBatchItem[] = [];
  let pendingReservations: PendingIntakeReservation[] = [];

  if (admin) {
    try {
      // 1. Fetch inventory batches
      const { data: batchesData } = await admin
        .from('inventory_batches')
        .select(`
          id,
          harvest_id,
          facility_id,
          reservation_id,
          actual_received_kg,
          discrepancy_kg,
          discrepancy_notes,
          status,
          received_at,
          harvests (id, crop, quantity, unit),
          facilities (id, name, location, county)
        `)
        .order('received_at', { ascending: false });

      if (batchesData) {
        const rows = batchesData as unknown as InventoryBatchRow[];
        initialBatches = rows.map((b) => {
          const harvest = b.harvests;
          const facility = b.facilities;
          const declared = Number(harvest?.quantity) || Number(b.actual_received_kg);
          const actual = Number(b.actual_received_kg);
          const variance = Number((declared - actual).toFixed(1));
          const pct = declared > 0 ? Number(((Math.abs(variance) / declared) * 100).toFixed(1)) : 0;

          return {
            id: b.id,
            harvestId: b.harvest_id,
            facilityId: b.facility_id,
            reservationId: b.reservation_id || undefined,
            crop: harvest?.crop || 'Tomatoes',
            declaredKg: declared,
            admittedKg: actual,
            varianceKg: variance,
            variancePercent: pct,
            status: b.status || 'received',
            facilityName: facility?.name || 'Kisii Central Cold Store Hub',
            receivedAt: b.received_at || new Date().toISOString(),
            chamberTemp: 11.8,
            chamberRh: 82,
            discrepancyNotes: b.discrepancy_notes || undefined,
          };
        });
      }

      // 2. Fetch pending reservations for intake weighbridge
      const { data: resData } = await admin
        .from('reservations')
        .select(`
          id,
          harvest_id,
          facility_id,
          quantity_kg,
          requested_start_at,
          status,
          harvests (id, crop, farmer_id)
        `)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (resData) {
        const rRows = resData as unknown as PendingReservationRow[];
        pendingReservations = rRows.map((r) => ({
          id: r.id,
          harvestId: r.harvest_id,
          facilityId: r.facility_id,
          crop: r.harvests?.crop || 'Produce',
          quantityKg: Number(r.quantity_kg),
          requestedStartAt: r.requested_start_at,
        }));
      }
    } catch (err) {
      console.error('Error fetching inventory batches:', err);
    }
  }

  // Fallback demo batch if database has no records yet
  if (initialBatches.length === 0) {
    initialBatches = [
      {
        id: 'batch-001',
        harvestId: 'KV-2026-001',
        facilityId: 'f0000001-0000-0000-0000-000000000001',
        crop: 'Tomatoes',
        declaredKg: 220,
        admittedKg: 218,
        varianceKg: 2,
        variancePercent: 0.9,
        status: 'received',
        facilityName: 'Kisii Central Cold Store Hub',
        receivedAt: new Date().toISOString(),
        chamberTemp: 11.8,
        chamberRh: 82,
      },
    ];
  }

  return (
    <AppShell allowedRoles={['farmer', 'facility_operator', 'operations_admin']}>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Storage Inventory Ledger"
          title={userRole === 'facility_operator' ? 'Facility Stored Inventory' : 'My stored produce'}
          description="Audited cold room inventory records, electronic weighbridge scale tare reconciliation, and batch release clearance."
          action={
            <Link
              href="/storage"
              className="flex h-11 items-center justify-center rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98"
            >
              Find cold storage
            </Link>
          }
        />

        <div className="mt-7">
          <InventoryClient
            userRole={userRole}
            initialBatches={initialBatches}
            pendingReservations={pendingReservations}
          />
        </div>
      </div>
    </AppShell>
  );
}
