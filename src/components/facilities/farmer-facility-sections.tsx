'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, PackageCheck, RefreshCw, Warehouse } from 'lucide-react';
import { z } from 'zod';
import { FacilityRequestList } from '@/components/facilities/facility-request-list';

export type FarmerFacilitySection = 'discover' | 'requests' | 'inventory' | 'alerts';

const NotificationSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  message: z.string(),
  resource_type: z.string().nullable().optional(),
  resource_id: z.string().nullable().optional(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

const StoredBatchSchema = z.object({
  id: z.string(),
  harvest_id: z.string(),
  actual_received_kg: z.coerce.number(),
  discrepancy_kg: z.coerce.number().nullable().optional(),
  status: z.string(),
  received_at: z.string(),
  harvests: z.object({
    crop: z.string(),
    quantity: z.coerce.number(),
    unit: z.string(),
  }).nullable(),
  facilities: z.object({
    name: z.string(),
    location: z.string(),
    county: z.string(),
  }).nullable(),
});

type FacilityNotification = z.infer<typeof NotificationSchema>;
type StoredBatch = z.infer<typeof StoredBatchSchema>;

export function FarmerFacilitySectionContent({
  section,
  onDiscover,
}: {
  section: Exclude<FarmerFacilitySection, 'discover'>;
  onDiscover: () => void;
}) {
  if (section === 'requests') return <FacilityRequestList onDiscover={onDiscover} />;
  if (section === 'inventory') return <StoredProducePanel onDiscover={onDiscover} />;
  return <FacilityAlertsPanel />;
}

function StoredProducePanel({ onDiscover }: { onDiscover: () => void }) {
  const [batches, setBatches] = useState<StoredBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/inventory-batches', { signal: controller.signal });
        const body = await response.json() as { inventoryBatches?: unknown; error?: { message?: string } };
        if (!response.ok) throw new Error(body.error?.message ?? 'Stored produce could not be loaded.');
        const parsed = z.array(StoredBatchSchema).safeParse(body.inventoryBatches);
        if (!parsed.success) throw new Error('Stored produce records were returned in an unsupported format.');
        setBatches(parsed.data);
      } catch (reason) {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Stored produce could not be loaded.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [reloadCount]);

  if (loading) return <div className="mt-6 h-48 animate-pulse rounded-2xl bg-[#E2DED6]/50" aria-label="Loading stored produce" />;

  return (
    <section className="mt-6 space-y-4" aria-labelledby="stored-produce-title">
      <header>
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Inventory</p>
        <h2 id="stored-produce-title" className="mt-1 text-xl font-bold text-[#17191D]">My stored produce</h2>
        <p className="mt-1 text-sm text-[#74767B]">Facility-admitted quantities and intake records associated with your harvests.</p>
      </header>
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => setReloadCount((count) => count + 1)} className="ml-3 font-bold underline">Retry</button>
        </div>
      )}
      {!error && batches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#CFC9BF] bg-white p-8 text-center">
          <Warehouse size={28} className="mx-auto text-[#74767B]" />
          <h3 className="mt-3 font-bold text-[#17191D]">No stored produce records</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#74767B]">Only facility intake records appear here. A reservation or transport request does not mean produce has been received into storage.</p>
          <button type="button" onClick={onDiscover} className="mt-5 min-h-11 rounded-xl bg-[#FF5A1F] px-4 text-sm font-bold text-white">Find a facility</button>
        </div>
      )}
      {batches.map((batch) => (
        <article key={batch.id} className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <PackageCheck size={14} /> {batch.status.replaceAll('_', ' ')}
              </span>
              <h3 className="mt-3 text-lg font-bold text-[#17191D]">{batch.harvests?.crop ?? 'Harvest'} · {batch.actual_received_kg.toLocaleString()} kg</h3>
              <p className="mt-1 text-sm text-[#74767B]">
                {batch.facilities ? `${batch.facilities.name} · ${batch.facilities.location}, ${batch.facilities.county}` : 'Facility details not provided'}
              </p>
            </div>
            <p className="text-xs text-[#74767B]">Received {new Date(batch.received_at).toLocaleString('en-KE')}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2DED6] pt-4">
            <p className="text-xs text-[#74767B]">
              {batch.harvests ? `Declared: ${batch.harvests.quantity} ${batch.harvests.unit}` : 'Declared quantity not provided'}
              {batch.discrepancy_kg !== null && batch.discrepancy_kg !== undefined ? ` · Intake variance: ${batch.discrepancy_kg} kg` : ''}
            </p>
            <Link href={`/harvests/${batch.harvest_id}`} className="inline-flex min-h-11 items-center font-bold text-[#FF5A1F] hover:underline">View harvest</Link>
          </div>
        </article>
      ))}
    </section>
  );
}

function FacilityAlertsPanel() {
  const [alerts, setAlerts] = useState<FacilityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/notifications', { signal: controller.signal });
        const body = await response.json() as { notifications?: unknown; error?: { message?: string } };
        if (!response.ok) throw new Error(body.error?.message ?? 'Facility alerts could not be loaded.');
        const parsed = z.array(NotificationSchema).safeParse(body.notifications);
        if (!parsed.success) throw new Error('Facility alerts were returned in an unsupported format.');
        setAlerts(parsed.data);
      } catch (reason) {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Facility alerts could not be loaded.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [reloadCount]);

  const markRead = async (alert: FacilityNotification) => {
    setUpdatingId(alert.id);
    setError('');
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [alert.id], read: !alert.read_at }),
      });
      const body = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? 'Alert status could not be updated.');
      setAlerts((current) => current.map((item) => item.id === alert.id
        ? { ...item, read_at: alert.read_at ? null : new Date().toISOString() }
        : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Alert status could not be updated.');
    } finally {
      setUpdatingId('');
    }
  };

  if (loading) return <div className="mt-6 h-48 animate-pulse rounded-2xl bg-[#E2DED6]/50" aria-label="Loading facility alerts" />;

  return (
    <section className="mt-6 space-y-4" aria-labelledby="facility-alerts-title">
      <header>
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Notifications</p>
        <h2 id="facility-alerts-title" className="mt-1 text-xl font-bold text-[#17191D]">Storage alerts</h2>
        <p className="mt-1 text-sm text-[#74767B]">Provider and workflow notifications for your account.</p>
      </header>
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => setReloadCount((count) => count + 1)} className="ml-3 font-bold underline"><RefreshCw size={13} className="inline" /> Retry</button>
        </div>
      )}
      {!error && alerts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#CFC9BF] bg-white p-8 text-center">
          <Bell size={28} className="mx-auto text-[#74767B]" />
          <h3 className="mt-3 font-bold text-[#17191D]">No facility alerts</h3>
          <p className="mt-2 text-sm text-[#74767B]">New account notifications will appear here. No sample alerts are shown.</p>
        </div>
      )}
      {alerts.map((alert) => (
        <article key={alert.id} className={`rounded-2xl border bg-white p-5 shadow-xs ${alert.read_at ? 'border-[#E2DED6]' : 'border-l-4 border-l-[#FF5A1F] border-[#E2DED6]'}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">{alert.event_type.replaceAll('_', ' ')}</p>
              <h3 className="mt-2 font-bold text-[#17191D]">{alert.message}</h3>
              <p className="mt-2 text-xs text-[#74767B]">{new Date(alert.created_at).toLocaleString('en-KE')}</p>
            </div>
            <button type="button" disabled={updatingId === alert.id} onClick={() => void markRead(alert)} className="min-h-11 rounded-lg border border-[#E2DED6] px-3 text-xs font-bold text-[#17191D] disabled:opacity-60">
              {updatingId === alert.id ? 'Updating…' : alert.read_at ? 'Mark unread' : 'Mark read'}
            </button>
          </div>
          {alert.resource_type && <p className="mt-3 text-xs text-[#74767B]">Related to {alert.resource_type.replaceAll('_', ' ')}{alert.resource_id ? ` · ${alert.resource_id}` : ''}</p>}
        </article>
      ))}
    </section>
  );
}
