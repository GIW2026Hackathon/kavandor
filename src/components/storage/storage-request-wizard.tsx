'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CertifiedFacility } from '@/data/facilities';
import type { HarvestRecord } from '@/lib/backend';

interface StorageRequestWizardProps {
  facility: CertifiedFacility;
  initialHarvestId?: string;
  initialQuantity?: string;
  initialCrop?: string;
}

export function StorageRequestWizard({
  facility,
  initialHarvestId,
  initialQuantity,
  initialCrop,
}: StorageRequestWizardProps) {
  const [step, setStep] = useState(0);
  const [farmerHarvests, setFarmerHarvests] = useState<HarvestRecord[]>([]);
  const [selectedHarvestId, setSelectedHarvestId] = useState<string>(initialHarvestId || '');
  const [quantity, setQuantity] = useState(initialQuantity || '220');
  
  // Future dates (now + 2 hours for arrival, + 7 days for end) with lazy state initializer
  const [start, setStart] = useState(() => new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16));
  const [end, setEnd] = useState(() => new Date(Date.now() + 7 * 86400 * 1000 + 2 * 3600 * 1000).toISOString().slice(0, 16));
  
  const [transport, setTransport] = useState<'songa_provider' | 'self_arranged'>('songa_provider');
  const [requirements, setRequirements] = useState('Keep ventilated and separated from damaged produce.');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storageReference, setStorageReference] = useState('');
  const [transportReference, setTransportReference] = useState('');

  // Fetch farmer's active harvests
  useEffect(() => {
    fetch('/api/harvests')
      .then((res) => res.json())
      .then((data) => {
        const list: HarvestRecord[] = Array.isArray(data.harvests) ? data.harvests : [];
        setFarmerHarvests(list);
        if (!selectedHarvestId && list.length > 0) {
          const match = initialCrop
            ? list.find((h) => h.crop.toLowerCase().includes(initialCrop.toLowerCase())) || list[0]
            : list[0];
          setSelectedHarvestId(match.id);
          if (!initialQuantity) {
            setQuantity(String(match.quantity));
          }
        }
      })
      .catch(() => {});
  }, [initialCrop, initialQuantity, selectedHarvestId]);

  const selectedHarvest = farmerHarvests.find((h) => h.id === selectedHarvestId) || {
    id: selectedHarvestId || 'KV-2026-001',
    farmerId: 'farmer-auth',
    crop: initialCrop || 'Tomatoes',
    quantity: Number(quantity) || 220,
    unit: 'kg',
    harvestDate: new Date().toISOString(),
    location: 'Nyakundi Farm, Kisii',
    status: 'assessed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const durationDays = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
  const storageCost = Number(quantity) * facility.pricePerUnit * durationDays;
  const estimatedTransport = 650;

  const next = () => {
    const qNum = Number(quantity);
    if (step === 0 && !selectedHarvestId && farmerHarvests.length > 0) {
      setError('Please select a registered harvest to allocate storage capacity.');
      return;
    }
    if (step === 1) {
      if (!quantity || qNum <= 0) {
        setError('Enter a valid storage quantity in kg.');
        return;
      }
      if (qNum > selectedHarvest.quantity) {
        setError(`Requested quantity cannot exceed the declared harvest quantity (${selectedHarvest.quantity} kg).`);
        return;
      }
      if (new Date(start) >= new Date(end)) {
        setError('Expected storage end date must be after the intake start date.');
        return;
      }
      if (new Date(start).getTime() < Date.now()) {
        setError('Intake arrival date must be in the future.');
        return;
      }
    }
    if (step === 2 && qNum > facility.availableCapacityKg) {
      setError(`The requested quantity (${qNum} kg) exceeds the facility available headroom (${facility.availableCapacityKg} kg).`);
      return;
    }
    setError('');
    setStep((current) => current + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const storagePayload = {
        harvestId: selectedHarvest.id,
        facilityId: facility.id,
        requestedQuantity: Number(quantity),
        quantityUnit: 'kg',
        requestedStartAt: new Date(start).toISOString(),
        expectedEndAt: new Date(end).toISOString(),
        storageRequirements: requirements,
        transportPreference: transport,
      };

      const storageResponse = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storagePayload),
      });

      if (!storageResponse.ok) {
        const errJson = await storageResponse.json().catch(() => ({}));
        throw new Error(errJson.message || 'The storage reservation could not be submitted.');
      }
      
      const storage = await storageResponse.json();
      const resId = storage.reservation?.id || storage.reservationId || 'RES-CONFIRMED';
      let transportReferenceValue = '';

      if (transport === 'songa_provider') {
        const transportResponse = await fetch('/api/transport-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            harvestId: selectedHarvest.id,
            storageRequestId: resId,
            pickupLocation: selectedHarvest.location || 'Kisii Farmgate',
            destinationLocation: `${facility.name}, ${facility.locality}`,
            requestedQuantity: Number(quantity),
            requestedPickupAt: new Date(start).toISOString(),
            loadingInstructions: requirements,
          }),
        });

        if (transportResponse.ok) {
          const transportResult = await transportResponse.json();
          transportReferenceValue = transportResult.transportRequest?.id || transportResult.job?.id || '';
        }
      }

      setStorageReference(resId);
      setTransportReference(transportReferenceValue);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  if (storageReference) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#00C896] text-white shadow-lg">
          <Check size={32} />
        </span>
        <p className="mt-6 text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
          Storage Reservation Persisted
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#17191D]">
          Reference #{storageReference.slice(0, 8)}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#74767B]">
          Capacity of {quantity} kg has been reserved at {facility.name}. {transportReference ? `Logistics dispatch #${transportReference.slice(0, 8)} has been scheduled for farmgate collection.` : 'Direct delivery self-arranged by producer.'}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/storage/requests/${storageReference}`}
            className="flex h-11 items-center justify-center rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-6 text-sm font-bold text-white shadow-sm transition active:scale-98"
          >
            View reservation record
          </Link>
          {transportReference && (
            <Link
              href={`/transport/requests/${transportReference}`}
              className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition shadow-2xs"
            >
              Track transport dispatch
            </Link>
          )}
          <Link
            href={`/harvests/${selectedHarvest.id}`}
            className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#74767B] hover:text-[#17191D] transition"
          >
            Back to harvest
          </Link>
        </div>
      </section>
    );
  }

  const steps = ['Harvest Lot', 'Storage Need', 'Facility Verification', 'Transport', 'Review & Commit'];

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 lg:py-10">
      <h1 className="sr-only">Request cold storage capacity</h1>
      <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
        Step {step + 1} of 5 · Storage Reservation Wizard
      </p>
      <div className="mt-3 flex gap-2">
        {steps.map((name, index) => (
          <span
            key={name}
            title={name}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index <= step ? 'bg-[#FF5A1F]' : 'bg-[#E2DED6]'
            }`}
          />
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-8 shadow-xs">
        {step === 0 && (
          <WizardPanel
            title="Select the harvest lot"
            copy="Choose the registered harvest batch to allocate into climate-controlled storage."
          >
            {farmerHarvests.length > 0 ? (
              <div className="space-y-3">
                {farmerHarvests.map((h) => {
                  const isSelected = h.id === selectedHarvest.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setSelectedHarvestId(h.id);
                        setQuantity(String(h.quantity));
                      }}
                      className={`w-full text-left rounded-xl border p-4 transition ${
                        isSelected
                          ? 'border-[#FF5A1F] bg-[#FFF0EB]/40 ring-1 ring-[#FF5A1F]'
                          : 'border-[#E2DED6] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#17191D]">{h.crop}</p>
                        <span className="font-mono text-xs font-bold text-[#FF5A1F]">
                          Lot #{h.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#74767B]">
                        {h.quantity} {h.unit} · {h.location} · Status: {h.status}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-[#00C896]/30 border-l-4 border-l-[#00C896] bg-[#E6F9F4] p-4 text-[#008765]">
                <p className="font-bold text-[#008765]">
                  {selectedHarvest.crop} · Lot #{selectedHarvest.id.slice(0, 8)}
                </p>
                <p className="mt-1 text-sm text-[#008765]/80">
                  {selectedHarvest.quantity} kg available · {selectedHarvest.location}
                </p>
              </div>
            )}
          </WizardPanel>
        )}

        {step === 1 && (
          <WizardPanel
            title="Specify storage duration & quantity"
            copy="Requested quantity must not exceed available harvest balance. Times must be in the future."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Requested quantity (kg)">
                <input
                  type="number"
                  min="1"
                  max={selectedHarvest.quantity}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="h-11 rounded-xl border border-[#E2DED6] px-3 text-[#17191D] outline-none focus:border-[#FF5A1F]"
                />
              </Field>
              <Field label="Intake arrival date and time">
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="h-11 rounded-xl border border-[#E2DED6] px-3 text-[#17191D] outline-none focus:border-[#FF5A1F]"
                />
              </Field>
              <Field label="Expected storage release date">
                <input
                  type="datetime-local"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="h-11 rounded-xl border border-[#E2DED6] px-3 text-[#17191D] outline-none focus:border-[#FF5A1F]"
                />
              </Field>
              <Field label="Handling & climate requirements">
                <textarea
                  value={requirements}
                  onChange={(event) => setRequirements(event.target.value)}
                  className="min-h-24 resize-none rounded-xl border border-[#E2DED6] p-3 text-[#17191D] outline-none focus:border-[#FF5A1F]"
                />
              </Field>
            </div>
          </WizardPanel>
        )}

        {step === 2 && (
          <WizardPanel
            title="Selected facility & capacity audit"
            copy="Certified cold chain capacity and current monitored climate readings."
          >
            <div className="overflow-hidden rounded-xl border border-[#E2DED6] bg-white">
              {facility.imageUrl && (
                <div className="relative aspect-[16/6] overflow-hidden bg-[#22252A]">
                  <Image
                    src={facility.imageUrl}
                    alt={facility.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 680px"
                    className="object-cover"
                  />
                  <span className="absolute bottom-3 left-3 rounded-md bg-[#17191D]/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Certified Cold Chain Hub
                  </span>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">
                    {facility.facilityType.replace('_', ' ')}
                  </p>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    {facility.verificationStatus === 'verified' ? 'Audited Facility' : 'Unverified'}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-[#17191D]">{facility.name}</h2>
                <p className="mt-1 text-sm text-[#74767B]">
                  {facility.locality}, {facility.county} County
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E2DED6] pt-4 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-xs text-[#74767B]">Available Capacity</span>
                    <p className="font-mono font-bold text-[#17191D]">{facility.availableCapacityKg.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <span className="text-xs text-[#74767B]">Storage Tariff</span>
                    <p className="font-mono font-bold text-[#17191D]">KSh {facility.pricePerUnit} / kg / day</p>
                  </div>
                  <div>
                    <span className="text-xs text-[#74767B]">Climate Monitored</span>
                    <p className="font-mono font-bold text-[#2563EB]">{facility.temperatureC}°C · {facility.humidityPercent}% RH</p>
                  </div>
                </div>
              </div>
            </div>
          </WizardPanel>
        )}

        {step === 3 && (
          <WizardPanel
            title="Logistics & transport arrangements"
            copy="Select verified agricultural transport provider or arrange direct self-delivery to intake gate."
          >
            <div className="grid gap-3">
              <Choice
                active={transport === 'songa_provider'}
                onClick={() => setTransport('songa_provider')}
                title="KAVANDOR Express Dispatch"
                detail="Dispatch verified regional transporter for scheduled farmgate collection directly to the facility."
                icon="EXPRESS"
              />
              <Choice
                active={transport === 'self_arranged'}
                onClick={() => setTransport('self_arranged')}
                title="Direct Self-Delivery"
                detail="Deliver produce directly to the cold facility intake weighbridge using own vehicle."
                icon="SELF"
              />
            </div>
          </WizardPanel>
        )}

        {step === 4 && (
          <WizardPanel
            title="Review reservation summary"
            copy="Review storage reservation details before locking capacity into the regional ledger."
          >
            <dl className="divide-y divide-[#E2DED6] border-y border-[#E2DED6]">
              <Summary label="Harvest Lot" value={`${selectedHarvest.crop} · Lot #${selectedHarvest.id.slice(0, 8)}`} />
              <Summary label="Allocated Quantity" value={`${quantity} kg`} />
              <Summary label="Duration" value={`${durationDays} day${durationDays === 1 ? '' : 's'}`} />
              <Summary label="Facility" value={facility.name} />
              <Summary label="Storage Tariff Estimate" value={`KSh ${storageCost.toLocaleString()}`} />
              <Summary
                label="Transport"
                value={
                  transport === 'songa_provider'
                    ? `KSh ${estimatedTransport.toLocaleString()} · scheduled dispatch`
                    : 'Direct Delivery · self-arranged'
                }
              />
              <Summary
                label="Total Estimated Outlay"
                value={`KSh ${(
                  storageCost + (transport === 'songa_provider' ? estimatedTransport : 0)
                ).toLocaleString()}`}
              />
            </dl>
          </WizardPanel>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-7 flex items-center justify-between border-t border-[#E2DED6] pt-5">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((current) => current - 1)}
            className="flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[#74767B] hover:text-[#17191D] disabled:opacity-30"
          >
            <ChevronLeft size={18} /> Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-6 text-sm font-bold text-white shadow-sm transition active:scale-98"
            >
              Continue <ChevronRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="h-11 rounded-xl bg-[#17191D] hover:bg-[#22252A] px-6 text-sm font-bold text-white shadow-sm disabled:opacity-60 transition active:scale-98"
            >
              {submitting ? 'Locking in capacity…' : 'Submit & lock reservation'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function WizardPanel({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-[#17191D]">{title}</h2>
      <p className="mt-2 mb-7 text-sm text-[#74767B]">{copy}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#17191D]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Choice({
  active,
  onClick,
  title,
  detail,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  detail: string;
  icon: 'EXPRESS' | 'SELF';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-4 rounded-xl border p-4 text-left transition ${
        active
          ? 'border-[#FF5A1F] bg-[#FFF0EB]/40 ring-1 ring-[#FF5A1F]'
          : 'border-[#E2DED6] hover:bg-[#FAF9F5]'
      }`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#FAF9F5] text-xs font-mono font-bold text-[#FF5A1F]">
        {icon}
      </span>
      <div>
        <p className="font-bold text-[#17191D]">{title}</p>
        <p className="mt-1 text-sm text-[#74767B]">{detail}</p>
      </div>
    </button>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <dt className="text-[#74767B]">{label}</dt>
      <dd className="font-semibold text-[#17191D] font-mono">{value}</dd>
    </div>
  );
}
