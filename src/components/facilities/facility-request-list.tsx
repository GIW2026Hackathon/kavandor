'use client';

import { useEffect, useState } from 'react';

interface FacilityRequestRecord {
  id: string;
  quantity_kg: number;
  quantity_unit: string;
  status: string;
  requested_start_at: string | null;
  expected_end_at: string | null;
  created_at: string;
  source: string;
  facilities: { name: string; county: string; location: string } | null;
  harvests: { crop: string; quantity: number; unit: string; harvest_date: string } | null;
}

function isRequestRecord(value: unknown): value is FacilityRequestRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' &&
    typeof record.quantity_kg === 'number' &&
    typeof record.status === 'string' &&
    typeof record.created_at === 'string';
}

export function FacilityRequestList({ onDiscover }: { onDiscover?: () => void }) {
  const [requests, setRequests] = useState<FacilityRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch('/api/reservations', { signal: controller.signal });
        const body = await response.json() as { reservations?: unknown; error?: { message?: string } };
        if (!response.ok) throw new Error(body.error?.message ?? 'Facility requests could not be loaded.');
        if (!Array.isArray(body.reservations) || !body.reservations.every(isRequestRecord)) {
          throw new Error('Facility requests were returned in an unsupported format.');
        }
        setRequests(body.reservations);
      } catch (reason) {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Facility requests could not be loaded.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  if (loading) return <div className="mt-7 h-48 animate-pulse rounded-2xl bg-[#E2DED6]/50" aria-label="Loading facility requests" />;

  return (
    <section className="mt-7 space-y-4">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {!error && requests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#CFC9BF] bg-white p-8 text-center">
          <h2 className="font-bold text-[#17191D]">No facility requests yet</h2>
          <p className="mt-2 text-sm text-[#74767B]">Submit a service request from a facility that lists a matching capacity slot.</p>
        </div>
      )}
      {requests.map((request) => (
        <article key={request.id} className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                request.status === 'confirmed'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}>
                {request.status.replaceAll('_', ' ')}
              </span>
              <h2 className="mt-4 text-xl font-bold text-[#17191D]">{request.harvests?.crop ?? 'Harvest'} · {request.quantity_kg.toLocaleString()} {request.quantity_unit || 'kg'}</h2>
              <p className="mt-1 text-sm font-semibold text-[#17191D]">{request.facilities?.name ?? 'Facility details unavailable'}</p>
              <p className="mt-1 text-sm text-[#74767B]">{request.facilities ? `${request.facilities.location}, ${request.facilities.county}` : 'Location not provided'}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#74767B]">Request reference</p>
              <p className="mt-1 break-all font-mono text-xs font-semibold text-[#17191D]">{request.id}</p>
              <p className="mt-2 text-xs text-[#74767B]">Submitted {new Date(request.created_at).toLocaleString('en-KE')}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 border-t border-[#E2DED6] pt-4 text-sm sm:grid-cols-3">
            <Info label="Requested start" value={request.requested_start_at ? new Date(request.requested_start_at).toLocaleString('en-KE') : 'Not provided'} />
            <Info label="Expected end" value={request.expected_end_at ? new Date(request.expected_end_at).toLocaleString('en-KE') : 'Not provided'} />
            <Info label="Data source" value={request.source === 'demo_data' ? 'Demonstration request' : request.source.replaceAll('_', ' ')} />
          </div>
          <p className="mt-4 rounded-xl bg-[#F6F3EC] p-4 text-xs leading-5 text-[#74767B]">
            A pending request is not a confirmed booking. Confirm service terms, final fees and transport with the provider.
          </p>
        </article>
      ))}
      {onDiscover && (
        <button type="button" onClick={onDiscover} className="inline-flex min-h-11 items-center font-bold text-[#FF5A1F] hover:underline">
          Discover facilities
        </button>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-[#74767B]">{label}</p><p className="mt-1 font-semibold text-[#17191D]">{value}</p></div>;
}
