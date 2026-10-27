'use client';

import { useRef, useState } from 'react';
import type { Facility } from '@/types/facility';

export function TransportQuoteRequest({
  harvestId,
  facility,
  quantityKg,
  location,
  county,
  requestedStart,
  condition,
  handling,
}: {
  harvestId: string;
  facility: Facility;
  quantityKg: number;
  location: string;
  county: string;
  requestedStart: string;
  condition: string;
  handling: string;
}) {
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef('');
  const fingerprint = useRef('');

  const submit = async () => {
    setSubmitting(true);
    setError('');
    const pickupAt = new Date(`${requestedStart}T08:00:00`);
    const payload = {
      harvestId,
      origin: `${location.trim()}, ${county.trim()}`,
      destination: `${facility.location}, ${facility.county}`,
      requestedQuantity: quantityKg,
      requestedPickupAt: pickupAt.toISOString(),
      loadingInstructions: handling.trim() || `Harvest condition: ${condition || 'Not provided'}.`,
    };
    const nextFingerprint = JSON.stringify(payload);
    if (fingerprint.current !== nextFingerprint) {
      idempotencyKey.current = crypto.randomUUID();
      fingerprint.current = nextFingerprint;
    }

    try {
      const response = await fetch('/api/transport-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify({ ...payload, idempotencyKey: idempotencyKey.current }),
      });
      const body = await response.json() as { transportRequest?: { id?: string }; error?: { message?: string } };
      if (!response.ok || !body.transportRequest?.id) {
        throw new Error(body.error?.message ?? 'The transport quote request could not be submitted.');
      }
      setReference(body.transportRequest.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The transport quote request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-[#E2DED6] bg-white p-4">
      <p className="text-sm font-bold text-[#17191D]">Transport quote</p>
      {reference ? (
        <p className="mt-2 text-sm text-[#74767B]">
          Quote request submitted · Reference <span className="break-all font-mono text-[#17191D]">{reference}</span>. No transporter is assigned and no price or pickup is confirmed.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-[#74767B]">Facility request is saved. Transport quote request is still pending submission.</p>
          {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
          <button type="button" disabled={submitting} onClick={() => void submit()} className="mt-3 min-h-11 rounded-xl border border-[#E2DED6] px-4 text-sm font-bold text-[#17191D] hover:bg-[#F6F3EC] disabled:opacity-60">
            {submitting ? 'Requesting quote…' : 'Request transport quote'}
          </button>
        </>
      )}
    </div>
  );
}
