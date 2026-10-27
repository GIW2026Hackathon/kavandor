'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Scale, ShieldCheck, Warehouse } from 'lucide-react';
import { useState } from 'react';

export interface StoredBatchItem {
  id: string;
  harvestId: string;
  facilityId: string;
  reservationId?: string;
  crop: string;
  declaredKg: number;
  admittedKg: number;
  varianceKg: number;
  variancePercent: number;
  status: string;
  facilityName: string;
  receivedAt: string;
  chamberTemp: number;
  chamberRh: number;
  discrepancyNotes?: string;
}

export interface PendingIntakeReservation {
  id: string;
  harvestId: string;
  facilityId: string;
  crop: string;
  quantityKg: number;
  farmerName?: string;
  requestedStartAt: string;
}

interface InventoryClientProps {
  userRole: string;
  initialBatches: StoredBatchItem[];
  pendingReservations: PendingIntakeReservation[];
}

export function InventoryClient({
  userRole,
  initialBatches,
  pendingReservations,
}: InventoryClientProps) {
  const router = useRouter();
  const [batches, setBatches] = useState<StoredBatchItem[]>(initialBatches);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedResId, setSelectedResId] = useState(pendingReservations[0]?.id || '');
  const [scaleWeight, setScaleWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const selectedReservation = pendingReservations.find((r) => r.id === selectedResId) || pendingReservations[0];
  const declaredKg = selectedReservation?.quantityKg || 0;
  const actualKg = Number(scaleWeight) || 0;
  const diffKg = Number((declaredKg - actualKg).toFixed(1));
  const variancePct = declaredKg > 0 && actualKg > 0 ? Number(((Math.abs(diffKg) / declaredKg) * 100).toFixed(1)) : 0;
  const isVarianceExceeded = variancePct > 5.0;

  const handleRecordIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) {
      setFormError('No pending reservation selected.');
      return;
    }
    if (actualKg <= 0) {
      setFormError('Enter a valid measured scale weight in kg.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await fetch('/api/inventory-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          harvestId: selectedReservation.harvestId,
          facilityId: selectedReservation.facilityId,
          reservationId: selectedReservation.id,
          actualReceivedKg: actualKg,
          status: 'received',
          discrepancyNotes: notes || (isVarianceExceeded ? `Automated scale variance audit: ${variancePct}%` : undefined),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to record intake batch.');
      }

      const data = await res.json();
      const newBatch = data.inventoryBatch;

      if (newBatch) {
        setBatches((prev) => [
          {
            id: newBatch.id,
            harvestId: newBatch.harvest_id || selectedReservation.harvestId,
            facilityId: newBatch.facility_id || selectedReservation.facilityId,
            reservationId: newBatch.reservation_id,
            crop: selectedReservation.crop,
            declaredKg,
            admittedKg: actualKg,
            varianceKg: diffKg,
            variancePercent: variancePct,
            status: newBatch.status || 'received',
            facilityName: 'Certified Cold Store',
            receivedAt: newBatch.received_at || new Date().toISOString(),
            chamberTemp: 11.8,
            chamberRh: 82,
            discrepancyNotes: notes,
          },
          ...prev,
        ]);
      }

      setFormSuccess(`Batch successfully admitted to chamber! Scale weight: ${actualKg} kg.`);
      setTimeout(() => {
        setShowIntakeModal(false);
        router.refresh();
      }, 1200);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to record intake.');
    } finally {
      setSubmitting(false);
    }
  };

  const isOperator = userRole === 'facility_operator' || userRole === 'operations_admin';

  return (
    <div>
      {/* Top action bar for Facility Operators */}
      {isOperator && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between text-[#17191D]">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#2563EB]">
              Facility Operator Controls
            </p>
            <p className="font-bold text-sm text-[#17191D]">
              Intake Weighbridge Scale & Chamber Allocation Gate
            </p>
            <p className="text-xs text-[#74767B]">
              {pendingReservations.length} incoming reservation{pendingReservations.length === 1 ? '' : 's'} awaiting weigh-in calibration.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowIntakeModal(true)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-4 text-xs font-bold text-white shadow-sm transition active:scale-98"
          >
            <Scale size={15} /> Record Intake Weigh-In
          </button>
        </div>
      )}

      {/* Batches List */}
      {batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E2DED6] bg-white p-12 text-center">
          <Warehouse size={40} className="mx-auto text-[#74767B]/50" />
          <h2 className="mt-4 text-lg font-bold text-[#17191D]">No stored inventory records found</h2>
          <p className="mt-2 text-sm text-[#74767B] max-w-md mx-auto">
            {isOperator
              ? 'No produce has been admitted to your facility chambers yet. Use the intake weighbridge scale to admit confirmed reservations.'
              : 'You have no produce currently held in regional cold storage. Reserve storage to protect your harvest.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {isOperator ? (
              <button
                type="button"
                onClick={() => setShowIntakeModal(true)}
                disabled={pendingReservations.length === 0}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#E44E18] disabled:opacity-50"
              >
                <Scale size={16} /> Record weighbridge intake
              </button>
            ) : (
              <Link
                href="/storage"
                className="flex h-11 items-center justify-center rounded-xl bg-[#FF5A1F] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#E44E18]"
              >
                Find certified storage
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {batches.map((batch) => {
            const hasDiscrepancy = batch.variancePercent > 5.0;

            return (
              <section
                key={batch.id}
                className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:p-6 transition hover:border-[#FF5A1F]/50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="inline-block rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                      Admitted · {batch.facilityName}
                    </span>
                    <h2 className="mt-3 text-xl font-bold text-[#17191D]">
                      {batch.crop} · Batch #{batch.id.slice(0, 8)}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-[#74767B]">
                      Harvest Lot #{batch.harvestId.slice(0, 8)} · Admitted on {new Date(batch.receivedAt).toLocaleDateString('en-KE')}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-[#2563EB]">
                    Chamber: {batch.chamberTemp}°C · {batch.chamberRh}% RH
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E2DED6] bg-[#E2DED6] sm:grid-cols-4">
                  <Quantity label="Declared" value={`${batch.declaredKg} kg`} />
                  <Quantity label="Admitted (Tare)" value={`${batch.admittedKg} kg`} />
                  <Quantity label="Available Balance" value={`${batch.admittedKg} kg`} />
                  <div className={`p-4 ${hasDiscrepancy ? 'bg-amber-50 text-amber-900' : 'bg-white'}`}>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#74767B]">Variance</p>
                    <p className={`mt-2 text-xl font-bold font-mono ${hasDiscrepancy ? 'text-amber-700' : 'text-[#17191D]'}`}>
                      {batch.varianceKg > 0 ? `−${batch.varianceKg} kg` : `+${Math.abs(batch.varianceKg)} kg`} ({batch.variancePercent}%)
                    </p>
                  </div>
                </div>

                {hasDiscrepancy ? (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                    <p>
                      <strong>Scale Tare Discrepancy Gate Alert:</strong> Measured variance ({batch.variancePercent}%) exceeded the 5% allowable moisture loss threshold. Batch is flagged for dual-scale recalibration before financial escrow release.
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs leading-5 text-[#74767B]">
                    Scale variance is within the 5% allowable threshold. Certified admitted weight ({batch.admittedKg} kg) determines capacity occupancy and final financial clearing.
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-3 border-t border-[#E2DED6] pt-4 sm:flex-row">
                  <Link
                    href={`/harvests/${batch.harvestId}`}
                    className="flex h-10 items-center justify-center rounded-xl border border-[#E2DED6] bg-white px-4 text-xs font-bold text-[#17191D] hover:bg-[#FAF9F5] transition"
                  >
                    View harvest record
                  </Link>
                  <Link
                    href={`/offers?harvestId=${batch.harvestId}`}
                    className="flex h-10 items-center justify-center gap-1 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-4 text-xs font-bold text-white shadow-sm transition"
                  >
                    Explore selling options & offers <ArrowRight size={14} />
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Operator Intake Weighbridge Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#E2DED6] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2DED6] pb-3">
              <div className="flex items-center gap-2 text-[#17191D]">
                <Scale size={20} className="text-[#FF5A1F]" />
                <h3 className="font-bold text-lg">Intake Scale Weigh-In Gate</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="text-[#74767B] hover:text-[#17191D] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordIntake} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#74767B] mb-1">
                  Select Incoming Reservation
                </label>
                {pendingReservations.length > 0 ? (
                  <select
                    value={selectedResId}
                    onChange={(e) => {
                      setSelectedResId(e.target.value);
                      const match = pendingReservations.find((r) => r.id === e.target.value);
                      if (match && !scaleWeight) setScaleWeight(String(match.quantityKg));
                    }}
                    className="h-11 w-full rounded-xl border border-[#E2DED6] bg-white px-3 text-sm text-[#17191D] outline-none focus:border-[#FF5A1F]"
                  >
                    {pendingReservations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.crop} · {r.quantityKg} kg (Res #{r.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-3 text-xs text-[#74767B]">
                    No incoming pending reservations currently on file.
                  </p>
                )}
              </div>

              {selectedReservation && (
                <div className="rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-3 text-xs">
                  <p className="text-[#74767B]">
                    Declared Dispatch Quantity: <strong className="font-mono text-[#17191D]">{declaredKg} kg</strong>
                  </p>
                  <p className="text-[#74767B] mt-1">
                    Harvest Lot: <strong className="font-mono text-[#17191D]">#{selectedReservation.harvestId.slice(0, 8)}</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#74767B] mb-1">
                  Measured Electronic Scale Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={scaleWeight}
                  onChange={(e) => setScaleWeight(e.target.value)}
                  placeholder={`e.g. ${declaredKg ? declaredKg - 2 : '218'}`}
                  className="h-11 w-full rounded-xl border border-[#E2DED6] px-3 font-mono text-sm text-[#17191D] outline-none focus:border-[#FF5A1F]"
                  required
                />
              </div>

              {/* Dynamic Live Variance Display */}
              {actualKg > 0 && declaredKg > 0 && (
                <div
                  className={`rounded-xl border p-3 text-xs ${
                    isVarianceExceeded
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {isVarianceExceeded ? (
                      <AlertTriangle size={14} className="text-amber-600" />
                    ) : (
                      <ShieldCheck size={14} className="text-emerald-600" />
                    )}
                    Tare Variance: {diffKg > 0 ? `−${diffKg}` : `+${Math.abs(diffKg)}`} kg ({variancePct}%)
                  </p>
                  <p className="mt-1 leading-5">
                    {isVarianceExceeded
                      ? 'Warning: Exceeds 5% gate threshold. Intake will be recorded with automated supervisor discrepancy alert.'
                      : 'Within allowable 5% threshold. Capacity and inventory ledger will balance atomically.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#74767B] mb-1">
                  Observed Physical Condition / Tare Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Clean crates, breaker-stage maturity, pre-cooled chamber bay A-03"
                  className="min-h-20 w-full resize-none rounded-xl border border-[#E2DED6] p-3 text-sm text-[#17191D] outline-none focus:border-[#FF5A1F]"
                />
              </div>

              {formError && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {formError}
                </p>
              )}
              {formSuccess && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  {formSuccess}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-[#E2DED6] pt-4">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-[#74767B] hover:text-[#17191D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedReservation}
                  className="h-10 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition"
                >
                  {submitting ? 'Admitting…' : 'Certify & Admit Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Quantity({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[#74767B]">{label}</p>
      <p className="mt-2 text-xl font-bold font-mono text-[#17191D]">{value}</p>
    </div>
  );
}
