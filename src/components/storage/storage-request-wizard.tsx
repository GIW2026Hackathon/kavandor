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
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#F2C303] text-[#004A25]"><Check size={28} /></span>
      <p className="mt-6 text-xs font-bold uppercase text-[#3E594B]">Storage request submitted</p>
      <h1 className="mt-2 text-3xl font-bold">Reference {storageReference}</h1>
      <p className="mt-3 text-sm leading-6 text-[#3E594B]">The facility must confirm this request. {transportReference ? `The demo transport request ${transportReference} is awaiting a Songa quote status.` : 'Pickup is being arranged by the farmer.'}</p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/storage/requests" className="flex h-11 items-center justify-center rounded-lg bg-[#004A25] px-5 text-sm font-bold text-white">View storage request</Link>{transportReference && <Link href={`/transport/requests/${transportReference}`} className="flex h-11 items-center justify-center rounded-lg border border-[#004A25]/15 px-5 text-sm font-bold">Track demo transport</Link>}</div>
    </section>
  );

  const steps = ['Harvest', 'Storage', 'Facility', 'Transport', 'Review'];
  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 lg:py-10">
      <h1 className="sr-only">Request storage</h1>
      <p className="text-xs font-bold uppercase text-[#3E594B]">Step {step + 1} of 5 · Demo request</p>
      <div className="mt-3 flex gap-2">{steps.map((name, index) => <span key={name} title={name} className={`h-1 flex-1 ${index <= step ? 'bg-[#004A25]' : 'bg-[#004A25]/10'}`} />)}</div>
      <section className="mt-8 border border-[#004A25]/10 bg-white p-5 sm:p-8">
        {step === 0 && <WizardPanel title="Choose the harvest" copy="The existing tomato harvest is used for this complete demo journey."><div className="border-l-2 border-[#76AC3C] bg-[#EDF5DF] p-4"><p className="font-bold">Tomatoes · KV-2026-001</p><p className="mt-1 text-sm text-[#3E594B]">220 kg available · harvested 26 Oct · Nyakundi farm, Kisii</p></div></WizardPanel>}
        {step === 1 && <WizardPanel title="Specify the storage need" copy="The quantity must remain within the declared harvest available for storage."><div className="grid gap-5 sm:grid-cols-2"><Field label="Requested quantity (kg)"><input type="number" min="1" max="220" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="h-11 border border-[#004A25]/15 px-3" /></Field><Field label="Arrival date and time"><input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} className="h-11 border border-[#004A25]/15 px-3" /></Field><Field label="Expected storage end"><input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} className="h-11 border border-[#004A25]/15 px-3" /></Field><Field label="Handling instructions"><textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} className="min-h-24 resize-none border border-[#004A25]/15 p-3" /></Field></div></WizardPanel>}
        {step === 2 && <WizardPanel title="Selected facility" copy="Capacity and price are demonstration values, not a confirmed booking."><div className="border border-[#004A25]/10 p-5"><p className="text-xs font-bold uppercase text-[#76AC3C]">Demo facility</p><h2 className="mt-2 text-xl font-bold">{facility.name}</h2><p className="mt-2 text-sm text-[#3E594B]">{facility.availableCapacityKg.toLocaleString()} kg available · KSh {facility.pricePerUnit} / kg / day · unverified</p><p className="mt-4 border-t border-[#004A25]/10 pt-4 text-sm text-[#3E594B]">Last reported condition: {facility.temperatureC}°C, {facility.humidityPercent}% relative humidity.</p></div></WizardPanel>}
        {step === 3 && <WizardPanel title="Choose transportation" copy="The Songa Mobility option is a demo workflow and is not connected to dispatch."><div className="grid gap-3"><Choice active={transport === 'songa_demo'} onClick={() => setTransport('songa_demo')} title="Arrange transport with Songa Mobility" detail="Create a demo pickup and delivery request. No dispatch or live vehicle is implied." icon="SONGA" /><Choice active={transport === 'self_arranged'} onClick={() => setTransport('self_arranged')} title="I will arrange transport myself" detail="Submit the storage request without creating a transport request." icon="SELF" /></div></WizardPanel>}
        {step === 4 && <WizardPanel title="Review and submit" copy="No request is confirmed until the facility and transport provider acknowledge it."><dl className="divide-y divide-[#004A25]/10 border-y border-[#004A25]/10"><Summary label="Harvest" value="Tomatoes · 220 kg total" /><Summary label="Storage quantity" value={`${quantity} kg`} /><Summary label="Duration" value={`${durationDays} demo day${durationDays === 1 ? '' : 's'}`} /><Summary label="Facility" value={facility.name} /><Summary label="Storage estimate" value={`KSh ${storageCost.toLocaleString()}`} /><Summary label="Transport" value={transport === 'songa_demo' ? `KSh ${estimatedTransport.toLocaleString()} · quote pending` : 'Self-arranged · not estimated'} /><Summary label="Estimated total" value={`KSh ${(storageCost + (transport === 'songa_demo' ? estimatedTransport : 0)).toLocaleString()} · before confirmation`} /></dl></WizardPanel>}
        {error && <p role="alert" className="mt-5 border-l-2 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <div className="mt-7 flex items-center justify-between border-t border-[#004A25]/10 pt-5"><button type="button" disabled={step === 0} onClick={() => setStep((current) => current - 1)} className="flex h-11 items-center gap-2 px-3 text-sm font-bold disabled:opacity-30"><ChevronLeft size={18} /> Back</button>{step < 4 ? <button type="button" onClick={next} className="flex h-11 items-center gap-2 rounded-lg bg-[#004A25] px-5 text-sm font-bold text-white">Continue <ChevronRight size={17} /></button> : <button type="button" onClick={submit} disabled={submitting} className="h-11 rounded-lg bg-[#F2C303] px-5 text-sm font-bold disabled:opacity-60">{submitting ? 'Submitting…' : 'Submit request'}</button>}</div>
      </section>
    </div>
  );
}

function WizardPanel({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) { return <div><h2 className="text-2xl font-bold">{title}</h2><p className="mt-2 mb-6 text-sm leading-6 text-[#3E594B]">{copy}</p>{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-semibold">{label}{children}</label>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-[130px_1fr] gap-3 py-3 text-sm"><dt className="text-[#3E594B]">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>; }
function Choice({ active, onClick, title, detail, icon }: { active: boolean; onClick: () => void; title: string; detail: string; icon: string }) { return <button type="button" onClick={onClick} className={`grid grid-cols-[58px_1fr] items-center gap-4 border p-4 text-left ${active ? 'border-[#76AC3C] bg-[#EDF5DF]' : 'border-[#004A25]/15'}`}><span className="grid size-12 place-items-center rounded-lg bg-[#004A25] text-xs font-bold text-[#F2C303]">{icon}</span><span><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-[#3E594B]">{detail}</span></span></button>; }
