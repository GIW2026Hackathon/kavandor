'use client';

import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { DemoFacility } from '@/demo/storage';

export function StorageRequestWizard({ facility }: { facility: DemoFacility }) {
  const [step, setStep] = useState(0);
  const [quantity, setQuantity] = useState('220');
  const [start, setStart] = useState('2026-10-27T08:00');
  const [end, setEnd] = useState('2026-11-03T08:00');
  const [transport, setTransport] = useState<'songa_demo' | 'self_arranged'>('songa_demo');
  const [requirements, setRequirements] = useState('Keep ventilated and separated from damaged produce.');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storageReference, setStorageReference] = useState('');
  const [transportReference, setTransportReference] = useState('');
  const durationDays = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
  const storageCost = Number(quantity) * facility.pricePerUnit * durationDays;
  const estimatedTransport = 650;

  const next = () => {
    if ((step === 1) && (!quantity || Number(quantity) <= 0 || Number(quantity) > 220)) {
      setError('Enter a quantity between 1 kg and the 220 kg available in this harvest.');
      return;
    }
    if (step === 2 && Number(quantity) > facility.availableCapacityKg) {
      setError('The requested quantity exceeds the available demo capacity.');
      return;
    }
    setError('');
    setStep((current) => current + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const storageResponse = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ harvestId: '33333333-3333-3333-3333-333333333333', facilityId: facility.id, requestedQuantity: Number(quantity), quantityUnit: 'kg', requestedStartAt: new Date(start).toISOString(), expectedEndAt: new Date(end).toISOString(), storageRequirements: requirements, transportPreference: transport }) });
      if (!storageResponse.ok) throw new Error('The storage request could not be submitted.');
      const storage = await storageResponse.json();
      let transportReferenceValue = '';
      if (transport === 'songa_demo') {
        const transportResponse = await fetch('/api/transport-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ harvestId: '33333333-3333-3333-3333-333333333333', storageRequestId: storage.reservation.id, pickupLocation: 'Nyakundi farm, Kisii', destinationLocation: `${facility.name}, ${facility.locality}`, requestedQuantity: Number(quantity), quantityUnit: 'kg', packageCount: 11, requestedPickupAt: new Date(start).toISOString(), loadingInstructions: requirements, contactName: 'James Nyakundi' }) });
        if (!transportResponse.ok) throw new Error('Storage was submitted, but the demo transport request failed.');
        const transportResult = await transportResponse.json();
        transportReferenceValue = transportResult.transportRequest.id;
      }
      setStorageReference(storage.reservation.id);
      setTransportReference(transportReferenceValue);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  if (storageReference) return (
    <section className="mx-auto max-w-2xl px-4 py-14 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#00C896] text-white shadow-lg">
        <Check size={32} />
      </span>
      <p className="mt-6 text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Storage request submitted</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#17191D]">Reference {storageReference}</h1>
      <p className="mt-3 text-sm leading-6 text-[#74767B]">
        The facility must confirm this request. {transportReference ? `The demo transport request ${transportReference} is awaiting a Songa quote status.` : 'Pickup is being arranged by the farmer.'}
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/storage/requests" className="flex h-11 items-center justify-center rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-6 text-sm font-bold text-white shadow-sm transition active:scale-98">
          View storage request
        </Link>
        {transportReference && (
          <Link href={`/transport/requests/${transportReference}`} className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition shadow-2xs">
            Track demo transport
          </Link>
        )}
      </div>
    </section>
  );

  const steps = ['Harvest', 'Storage', 'Facility', 'Transport', 'Review'];
  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 lg:py-10">
      <h1 className="sr-only">Request storage</h1>
      <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Step {step + 1} of 5 · Demo request</p>
      <div className="mt-3 flex gap-2">
        {steps.map((name, index) => (
          <span key={name} title={name} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= step ? 'bg-[#FF5A1F]' : 'bg-[#E2DED6]'}`} />
        ))}
      </div>
      <section className="mt-8 rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-8 shadow-xs">
        {step === 0 && (
          <WizardPanel title="Choose the harvest" copy="The existing tomato harvest is used for this complete demo journey.">
            <div className="rounded-xl border border-[#00C896]/30 border-l-4 border-l-[#00C896] bg-[#E6F9F4] p-4 text-[#008765]">
              <p className="font-bold text-[#008765]">Tomatoes · KV-2026-001</p>
              <p className="mt-1 text-sm text-[#008765]/80">220 kg available · harvested 26 Oct · Nyakundi farm, Kisii</p>
            </div>
          </WizardPanel>
        )}
        {step === 1 && (
          <WizardPanel title="Specify the storage need" copy="The quantity must remain within the declared harvest available for storage.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Requested quantity (kg)">
                <input type="number" min="1" max="220" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="h-11 rounded-xl border border-[#E2DED6] px-3 text-[#17191D] outline-none focus:border-[#FF5A1F]" />
              </Field>
              <Field label="Arrival date and time">
                <input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} className="h-11 rounded-xl border border-[#E2DED6] px-3 text-[#17191D] outline-none focus:border-[#FF5A1F]" />
              </Field>
              <Field label="Expected storage end">
                <input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} className="h-11 rounded-xl border border-[#E2DED6] px-3 text-[#17191D] outline-none focus:border-[#FF5A1F]" />
              </Field>
              <Field label="Handling instructions">
                <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} className="min-h-24 resize-none rounded-xl border border-[#E2DED6] p-3 text-[#17191D] outline-none focus:border-[#FF5A1F]" />
              </Field>
            </div>
          </WizardPanel>
        )}
        {step === 2 && (
          <WizardPanel title="Selected facility" copy="Capacity and price are demonstration values, not a confirmed booking.">
            <div className="rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-5">
              <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">Demo facility</p>
              <h2 className="mt-2 text-xl font-bold text-[#17191D]">{facility.name}</h2>
              <p className="mt-2 text-sm text-[#74767B] font-mono">
                {facility.availableCapacityKg.toLocaleString()} kg available · KSh {facility.pricePerUnit} / kg / day · unverified
              </p>
              <p className="mt-4 border-t border-[#E2DED6] pt-4 text-sm text-[#74767B]">
                Last reported condition: <span className="font-mono font-semibold text-[#2563EB]">{facility.temperatureC}°C</span>, {facility.humidityPercent}% relative humidity.
              </p>
            </div>
          </WizardPanel>
        )}
        {step === 3 && (
          <WizardPanel title="Choose transportation" copy="The Songa Mobility option is a demo workflow and is not connected to dispatch.">
            <div className="grid gap-3">
              <Choice active={transport === 'songa_demo'} onClick={() => setTransport('songa_demo')} title="Arrange transport with Songa Mobility" detail="Create a demo pickup and delivery request. No dispatch or live vehicle is implied." icon="SONGA" />
              <Choice active={transport === 'self_arranged'} onClick={() => setTransport('self_arranged')} title="I will arrange transport myself" detail="Submit the storage request without creating a transport request." icon="SELF" />
            </div>
          </WizardPanel>
        )}
        {step === 4 && (
          <WizardPanel title="Review and submit" copy="No request is confirmed until the facility and transport provider acknowledge it.">
            <dl className="divide-y divide-[#E2DED6] border-y border-[#E2DED6]">
              <Summary label="Harvest" value="Tomatoes · 220 kg total" />
              <Summary label="Storage quantity" value={`${quantity} kg`} />
              <Summary label="Duration" value={`${durationDays} demo day${durationDays === 1 ? '' : 's'}`} />
              <Summary label="Facility" value={facility.name} />
              <Summary label="Storage estimate" value={`KSh ${storageCost.toLocaleString()}`} />
              <Summary label="Transport" value={transport === 'songa_demo' ? `KSh ${estimatedTransport.toLocaleString()} · quote pending` : 'Self-arranged · not estimated'} />
              <Summary label="Estimated total" value={`KSh ${(storageCost + (transport === 'songa_demo' ? estimatedTransport : 0)).toLocaleString()} · before confirmation`} />
            </dl>
          </WizardPanel>
        )}
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex items-center justify-between border-t border-[#E2DED6] pt-5">
          <button type="button" disabled={step === 0} onClick={() => setStep((current) => current - 1)} className="flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[#74767B] hover:text-[#17191D] disabled:opacity-30">
            <ChevronLeft size={18} /> Back
          </button>
          {step < 4 ? (
            <button type="button" onClick={next} className="flex h-11 items-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-6 text-sm font-bold text-white shadow-sm transition active:scale-98">
              Continue <ChevronRight size={17} />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting} className="h-11 rounded-xl bg-[#17191D] hover:bg-[#22252A] px-6 text-sm font-bold text-white shadow-sm disabled:opacity-60 transition active:scale-98">
              {submitting ? 'Submitting…' : 'Submit request'}
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
      <p className="mt-2 mb-6 text-sm leading-6 text-[#74767B]">{copy}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold text-[#17191D]">{label}{children}</label>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-3 text-sm">
      <dt className="text-[#74767B]">{label}</dt>
      <dd className="text-right font-semibold text-[#17191D] font-mono">{value}</dd>
    </div>
  );
}

function Choice({ active, onClick, title, detail, icon }: { active: boolean; onClick: () => void; title: string; detail: string; icon: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid grid-cols-[58px_1fr] items-center gap-4 rounded-xl border p-4 text-left transition ${
        active ? 'border-[#FF5A1F] bg-[#FFF0EB] shadow-xs' : 'border-[#E2DED6] bg-white hover:border-[#17191D]'
      }`}
    >
      <span className="grid size-12 place-items-center rounded-xl bg-[#17191D] text-xs font-mono font-bold text-[#FF5A1F] shadow-xs">
        {icon}
      </span>
      <span>
        <strong className="block text-sm font-bold text-[#17191D]">{title}</strong>
        <span className="mt-1 block text-xs leading-5 text-[#74767B]">{detail}</span>
      </span>
    </button>
  );
}
