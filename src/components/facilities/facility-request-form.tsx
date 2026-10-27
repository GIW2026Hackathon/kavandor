'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { TransportQuoteRequest } from '@/components/facilities/transport-quote-request';
import { normalizeCommodity } from '@/lib/facility-discovery';
import type { Facility } from '@/types/facility';

export function FacilityRequestForm({
  facility,
  crop,
  quantityKg,
  location,
  county,
  harvestDate,
  condition,
  intendedOutcome,
  durationDays,
  serviceStart,
  onClose,
}: {
  facility: Facility;
  crop: string;
  quantityKg: number;
  location: string;
  county: string;
  harvestDate: string;
  condition: string;
  intendedOutcome: string;
  durationDays: number;
  serviceStart: string;
  onClose: () => void;
}) {
  const [requestedStart, setRequestedStart] = useState(serviceStart);
  const [handling, setHandling] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [harvestId, setHarvestId] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [transportChoice, setTransportChoice] = useState<'self_arranged' | 'request_quote'>('self_arranged');
  const harvestKey = useRef('');
  const reservationKey = useRef('');
  const reservationFingerprint = useRef('');

  const submit = async () => {
    if (!harvestDate || !location.trim() || !county.trim() || quantityKg <= 0) {
      setError('Add the harvest date, farm location, county and a positive quantity before requesting a service.');
      return;
    }
    if (!requestedStart || !Number.isInteger(durationDays) || durationDays < 1) {
      setError('Choose a service start date and a duration of at least one day.');
      return;
    }
    if (new Date(`${requestedStart}T08:00:00`).getTime() <= Date.now()) {
      setError('The requested service start must be in the future.');
      return;
    }
    if (harvestDate && requestedStart < harvestDate) {
      setError('The requested service start cannot be before the harvest date.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const acceptedCrop = facility.acceptedCommodities.find((item) => normalizeCommodity(item) === normalizeCommodity(crop)) ?? crop;
      let existingHarvestId = harvestId;
      if (!existingHarvestId) {
        harvestKey.current ||= crypto.randomUUID();
        const harvestResponse = await fetch('/api/harvests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': harvestKey.current },
          body: JSON.stringify({
            crop: acceptedCrop,
            quantity: quantityKg,
            unit: 'kg',
            harvestDate: new Date(`${harvestDate}T00:00:00`).toISOString(),
            location: location.trim(),
            county: county.trim(),
            handlingNotes: [
              `Current condition: ${condition || 'Not provided'}.`,
              `Intended outcome: ${intendedOutcome}.`,
              handling.trim() ? `Handling requirements: ${handling.trim()}` : '',
            ].filter(Boolean).join(' '),
            availability: 'Available for facility service',
            idempotencyKey: harvestKey.current,
          }),
        });
        const harvestBody = await harvestResponse.json() as { harvest?: { id?: string }; error?: { message?: string } };
        if (!harvestResponse.ok || !harvestBody.harvest?.id) {
          throw new Error(harvestBody.error?.message ?? 'The harvest record could not be created.');
        }
        existingHarvestId = harvestBody.harvest.id;
        setHarvestId(existingHarvestId);
      }

      const start = new Date(`${requestedStart}T08:00:00`);
      const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const reservationPayload = {
        harvestId: existingHarvestId,
        facilityId: facility.id,
        requestedQuantity: quantityKg,
        requestedStartAt: start.toISOString(),
        expectedEndAt: end.toISOString(),
        storageRequirements: [
          'Please confirm service availability and the final service fee before acceptance.',
          `Intended outcome: ${intendedOutcome}.`,
          `Current condition: ${condition || 'Not provided'}.`,
          handling.trim() ? `Handling requirements: ${handling.trim()}` : '',
        ].filter(Boolean).join(' '),
      };
      const currentFingerprint = JSON.stringify(reservationPayload);
      if (reservationFingerprint.current !== currentFingerprint) {
        reservationKey.current = crypto.randomUUID();
        reservationFingerprint.current = currentFingerprint;
      }
      const reservationResponse = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': reservationKey.current },
        body: JSON.stringify({ ...reservationPayload, idempotencyKey: reservationKey.current }),
      });
      const reservationBody = await reservationResponse.json() as { reservation?: { id?: string }; error?: { message?: string } };
      if (!reservationResponse.ok || !reservationBody.reservation?.id) {
        throw new Error(reservationBody.error?.message ?? `Harvest ${existingHarvestId} was saved, but the facility request was not submitted.`);
      }
      setReservationId(reservationBody.reservation.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The facility request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  if (reservationId) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6" aria-live="polite">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-700" />
          <div className="min-w-0">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">Request submitted · Pending provider review</p>
            <h3 className="mt-2 text-lg font-bold text-[#17191D]">{facility.name}</h3>
            <p className="mt-2 break-all text-sm text-[#17191D]">Reference: {reservationId}</p>
            <p className="mt-2 text-sm leading-6 text-[#74767B]">
              This request is not a confirmed booking. The facility must confirm the service and final terms. Market returns are not included.
            </p>
            {transportChoice === 'request_quote' && (
              <TransportQuoteRequest
                harvestId={harvestId}
                facility={facility}
                quantityKg={quantityKg}
                location={location}
                county={county}
                requestedStart={requestedStart}
                condition={condition}
                handling={handling}
              />
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/storage/requests" className="flex h-11 items-center rounded-xl bg-[#17191D] px-4 text-sm font-bold text-white hover:bg-[#22252A]">
                View requests
              </Link>
              <button type="button" onClick={onClose} className="h-11 rounded-xl border border-emerald-300 px-4 text-sm font-bold text-[#17191D] hover:bg-white">
                Back to facilities
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Request facility service</p>
          <h3 className="mt-2 text-xl font-bold text-[#17191D]">{facility.name}</h3>
          <p className="mt-2 text-sm leading-6 text-[#74767B]">
            Creates a harvest record and submits a pending capacity request. The workflow holds the requested quantity in the facility ledger while the provider reviews it; this is not a confirmed booking.
          </p>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 rounded-lg px-3 text-sm font-bold text-[#74767B] hover:bg-[#F6F3EC] hover:text-[#17191D]">
          Close
        </button>
      </div>

      <dl className="mt-5 grid gap-3 rounded-xl bg-[#F6F3EC] p-4 text-sm sm:grid-cols-2">
        <Summary label="Harvest" value={`${crop} · ${quantityKg.toLocaleString()} kg`} />
        <Summary label="Location" value={`${location}, ${county}`} />
        <Summary label="Harvest date" value={harvestDate || 'Not provided'} />
        <Summary label="Intended outcome" value={intendedOutcome} />
      </dl>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Requested service start">
          <input type="date" value={requestedStart} onChange={(event) => setRequestedStart(event.target.value)} className="h-11 rounded-xl border border-[#E2DED6] px-3 text-sm text-[#17191D] focus:border-[#FF5A1F] focus:outline-none" />
        </Field>
        <Field label="Planned duration (days)">
          <input type="number" min="1" max="60" value={durationDays} readOnly className="h-11 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] px-3 text-sm text-[#17191D]" />
        </Field>
        <Field label="Handling requirements (optional)">
          <textarea value={handling} onChange={(event) => setHandling(event.target.value)} maxLength={2000} rows={3} className="rounded-xl border border-[#E2DED6] p-3 text-sm text-[#17191D] focus:border-[#FF5A1F] focus:outline-none sm:col-span-2" placeholder="Share any service or handling requirements" />
        </Field>
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm font-bold text-[#17191D]">Transport coordination</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-[#E2DED6] p-4 text-sm">
            <input type="radio" name="transport-choice" value="self_arranged" checked={transportChoice === 'self_arranged'} onChange={() => setTransportChoice('self_arranged')} className="mt-1 accent-[#FF5A1F]" />
            <span><strong className="block text-[#17191D]">I will arrange transport</strong><span className="mt-1 block text-xs text-[#74767B]">Transport cost is not estimated.</span></span>
          </label>
          <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-[#E2DED6] p-4 text-sm">
            <input type="radio" name="transport-choice" value="request_quote" checked={transportChoice === 'request_quote'} onChange={() => setTransportChoice('request_quote')} className="mt-1 accent-[#FF5A1F]" />
            <span><strong className="block text-[#17191D]">Request a transport quote</strong><span className="mt-1 block text-xs text-[#74767B]">Creates a separate quote-pending request; no dispatch or price is confirmed.</span></span>
          </label>
        </div>
      </fieldset>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2DED6] pt-5">
        <p className="max-w-xl text-xs leading-5 text-[#74767B]">Ask the provider to confirm availability and final service fees. Transport, processing output and net return are not confirmed by this request.</p>
        <button type="button" disabled={submitting} onClick={submit} className="min-h-11 rounded-xl bg-[#FF5A1F] px-5 text-sm font-bold text-white transition hover:bg-[#E44E18] disabled:cursor-wait disabled:opacity-60">
          {submitting ? 'Submitting request…' : 'Request availability & quote'}
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold text-[#17191D]">{label}{children}</label>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#74767B]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#17191D]">{value}</dd>
    </div>
  );
}
