'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, MapPin, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DemoNotice } from '@/components/layout/app-shell-client';
import { FacilityRequestForm } from '@/components/facilities/facility-request-form';
import { estimateServiceCost, facilityBenefit, facilityCategory, formatFacilityPrice, getMatchingSlot, getServiceConditions, normalizeCommodity } from '@/lib/facility-discovery';
import { FacilitySchema, type Facility } from '@/types/facility';

interface HarvestRequestContext {
  crop: string;
  quantityKg: number;
  location: string;
  county: string;
  harvestDate: string;
  condition: string;
  intendedOutcome: string;
  durationDays: number;
  serviceStart: string;
}

export function FacilityDetails({
  facilityId,
  facilityRecord,
  harvest,
  onBack,
}: {
  facilityId?: string;
  facilityRecord?: Facility;
  harvest?: HarvestRequestContext;
  onBack?: () => void;
}) {
  const [fetchedFacility, setFetchedFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(!facilityRecord);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(harvest ? String(harvest.quantityKg) : '');
  const [durationDays, setDurationDays] = useState(harvest?.durationDays ?? 1);
  const [serviceStart, setServiceStart] = useState(harvest?.serviceStart ?? '');
  const facility = facilityRecord ?? fetchedFacility;

  useEffect(() => {
    if (facilityRecord || !facilityId) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/facilities/${encodeURIComponent(facilityId)}`, { signal: controller.signal });
        const body = await response.json() as { facility?: unknown; error?: { message?: string } };
        if (!response.ok) throw new Error(body.error?.message ?? 'Facility details could not be loaded.');
        const parsed = FacilitySchema.safeParse(body.facility);
        if (!parsed.success) throw new Error('Facility details were returned in an unsupported format.');
        setFetchedFacility(parsed.data);
      } catch (reason) {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Facility details could not be loaded.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [facilityId, facilityRecord]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-10" aria-label="Loading facility details"><div className="h-96 animate-pulse rounded-2xl bg-[#E2DED6]/50" /></div>;
  }
  if (error || !facility) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-[#17191D]">Facility details unavailable</h1>
        <p role="alert" className="mt-3 text-sm text-[#74767B]">{error || 'No facility record was found.'}</p>
        <Link href="/storage" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-[#FF5A1F]"><ArrowLeft size={17} /> Back to facilities</Link>
      </div>
    );
  }

  const quantityKg = harvest?.quantityKg ?? Number(quantity);
  const requestedDuration = harvest?.durationDays ?? durationDays;
  const requestedStart = harvest?.serviceStart || serviceStart;
  const harvestDate = harvest?.harvestDate ?? '';
  const matchingSlot = getMatchingSlot(facility, requestedStart, requestedDuration, quantityKg, harvestDate);
  const estimatedCost = estimateServiceCost(facility, quantityKg, requestedDuration);
  const benefit = facilityBenefit(facility);
  const conditions = getServiceConditions(facility);
  const cropMatches = Boolean(
    harvest?.crop &&
    facility.acceptedCommodities.some((commodity) => normalizeCommodity(commodity) === normalizeCommodity(harvest.crop)),
  );
  const canRequest = Boolean(
    harvest &&
    cropMatches &&
    harvest.location.trim() &&
    harvest.county.trim() &&
    harvest.harvestDate &&
    matchingSlot,
  );

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#74767B] hover:text-[#17191D]">
          <ArrowLeft size={17} /> Back to matching facilities
        </button>
      ) : (
        <Link href="/storage" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#74767B] hover:text-[#17191D]">
          <ArrowLeft size={17} /> All facilities
        </Link>
      )}
      <header className="mt-4 rounded-2xl bg-[#17191D] p-5 text-white shadow-md sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF7A45]">{facilityCategory(facility)} · {facility.isDemo ? 'Demonstration record' : 'Provider record'}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{facility.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-white/70"><MapPin size={16} /> {facility.location}, {facility.county} · Distance not provided</p>
          </div>
          <Verification facility={facility} />
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-white/70">{facility.description || 'Provider description not provided.'}</p>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(290px,.65fr)]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-xl font-bold text-[#17191D]">Service and requirements</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail label="Accepted crops" value={facility.acceptedCommodities.length ? facility.acceptedCommodities.join(', ') : 'Not provided'} />
              <Detail label="Facility services" value={[facility.type, facility.facilityType].filter(Boolean).join(' · ') || 'Not provided'} />
              <Detail label="Service price" value={formatFacilityPrice(facility)} />
              <Detail label="Minimum quantity" value={facility.minimumQuantity === null ? 'Not provided' : `${facility.minimumQuantity} ${facility.capacityUnit || 'kg'}`} />
              <Detail label="Storage / processing conditions" value={conditions || 'Not provided; confirm provider requirements'} />
              <Detail label="Distance from your farm" value="Not provided; farm coordinates are needed to calculate it" />
              <Detail label="Last availability update" value={facility.availabilityUpdatedAt ? new Date(facility.availabilityUpdatedAt).toLocaleString('en-KE') : 'Not provided'} />
              <Detail label="Provider verification" value={facility.isDemo ? 'Demonstration data; not provider verified' : facility.verificationStatus.replaceAll('_', ' ')} />
            </dl>
          </article>

          <article className="rounded-2xl border-2 border-[#FF5A1F] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FFF0EB] text-[#FF5A1F]"><CircleHelp size={20} /></span>
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Decision support</p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#17191D]">What will I gain?</h2>
              </div>
            </div>
            <p className="mt-4 text-base leading-7 text-[#212329]">{benefit.summary}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoPanel title="Potential market opportunity" text="Not provided. Buyer specifications, demand and selling prices must be confirmed before choosing a service." />
              <InfoPanel title="Risks and limitations" text={benefit.limitation} />
            </div>
            <div className="mt-5 rounded-xl border border-[#E2DED6] bg-[#F6F3EC] p-4">
              <h3 className="font-bold text-[#17191D]">Estimate a known service fee</h3>
              <p className="mt-1 text-xs leading-5 text-[#74767B]">Fee estimates are possible only when the provider lists a per-kg price. Transport and market returns are excluded.</p>
              {harvest ? (
                <p className="mt-3 text-sm text-[#17191D]">
                  Estimate for {quantityKg > 0 ? `${quantityKg.toLocaleString()} kg over ${requestedDuration} day(s)` : 'your entered quantity and duration'}.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Input label="Quantity (kg)" type="number" value={quantity} onChange={setQuantity} />
                  <Input label="Duration (days)" type="number" value={String(durationDays)} onChange={(value) => setDurationDays(Math.max(1, Number(value) || 1))} />
                  <Input label="Service start" type="date" value={serviceStart} onChange={setServiceStart} />
                </div>
              )}
              <dl className="mt-4 grid gap-3 border-t border-[#E2DED6] pt-4 sm:grid-cols-3">
                <Detail label="Listed service fee" value={formatFacilityPrice(facility)} />
                <Detail label="Estimated service cost" value={estimatedCost === null ? 'Cannot estimate from available price data' : `Est. KSh ${Math.round(estimatedCost).toLocaleString('en-KE')}`} />
                <Detail label="Estimated net return" value="Cannot estimate — selling price, output and transport are missing" />
              </dl>
              <p className="mt-3 text-xs leading-5 text-[#74767B]">Assumptions: listed price applies to the entered quantity; a daily fee is multiplied by duration. No other charges, yield changes or selling prices are included.</p>
            </div>
          </article>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-lg font-bold text-[#17191D]">Availability and capacity</h2>
            {facility.availabilitySlots.length ? (
              <div className="mt-4 space-y-3">
                {facility.availabilitySlots.map((slot) => (
                  <div key={slot.id} className="rounded-xl border border-[#E2DED6] p-4">
                    <p className="font-bold text-[#17191D]">{slot.availableCapacityKg.toLocaleString()} kg listed available</p>
                    <p className="mt-1 text-xs leading-5 text-[#74767B]">
                      {new Date(slot.windowStart).toLocaleString('en-KE')} – {new Date(slot.windowEnd).toLocaleString('en-KE')}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-amber-800">Listed capacity; source and live confirmation are not provided. Reconfirm before planning transport.</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-[#F6F3EC] p-4 text-sm leading-6 text-[#74767B]">No capacity slot was provided. Availability confirmation required.</p>
            )}
            {matchingSlot && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                A listed slot fits the entered quantity and dates. This is not a confirmed booking.
              </p>
            )}
            {harvest ? (
              <a href={canRequest ? '#facility-request' : '#harvest-details'} className="mt-5 flex min-h-12 items-center justify-between rounded-xl bg-[#FF5A1F] px-4 text-sm font-bold text-white transition hover:bg-[#E44E18]">
                {canRequest ? 'Continue to service request' : 'Review harvest details and capacity'} <ArrowRight size={17} />
              </a>
            ) : (
              <Link href={`/storage?facilityId=${encodeURIComponent(facility.id)}`} className="mt-5 flex min-h-12 items-center justify-between rounded-xl bg-[#FF5A1F] px-4 text-sm font-bold text-white transition hover:bg-[#E44E18]">
                Continue in facility discovery <ArrowRight size={17} />
              </Link>
            )}
            <p className="mt-3 text-xs leading-5 text-[#74767B]">The request will be validated against crop compatibility and the live capacity ledger. A pending request is not provider confirmation.</p>
          </section>

          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs">
            <h2 className="font-bold text-[#17191D]">Transport coordination</h2>
            <p className="mt-2 text-sm leading-6 text-[#74767B]">No transport quote is available for this facility. Arrange transport separately and confirm the cost before committing.</p>
            <dl className="mt-4"><Detail label="Transport cost" value="Not provided" /></dl>
          </section>
        </aside>
      </section>
      {harvest && (
        <section className="mt-7" id="facility-request" aria-labelledby="request-step-title">
          <div className="mb-4">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Step 3 · Take action</p>
            <h2 id="request-step-title" className="mt-1 text-xl font-bold text-[#17191D]">Request this facility service</h2>
          </div>
          {canRequest ? (
            <FacilityRequestForm
              facility={facility}
              crop={harvest.crop}
              quantityKg={harvest.quantityKg}
              location={harvest.location}
              county={harvest.county}
              harvestDate={harvest.harvestDate}
              condition={harvest.condition}
              intendedOutcome={harvest.intendedOutcome}
              durationDays={harvest.durationDays}
              serviceStart={harvest.serviceStart}
              onClose={onBack ?? (() => undefined)}
            />
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {!harvest.crop
                ? 'Enter a crop in your harvest details before requesting this service.'
                : !cropMatches
                  ? `This facility has not listed ${harvest.crop} as an accepted crop. Choose a compatible facility before requesting service.`
                  : !harvest.quantityKg || !harvest.location.trim() || !harvest.county.trim() || !harvest.harvestDate
                    ? 'Complete the harvest quantity, location, county and harvest date before requesting service.'
                    : 'No listed capacity slot matches this quantity and service window. Choose another facility or update the requested dates; no request has been submitted.'}
            </p>
          )}
        </section>
      )}
      <div className="mt-7"><DemoNotice>Facility records are provider/database sourced. Missing availability, conditions, fees or market inputs are not estimated.</DemoNotice></div>
    </div>
  );
}

function Verification({ facility }: { facility: Facility }) {
  const verified = facility.verificationStatus === 'verified' && !facility.isDemo;
  return (
    <span className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold ${
      verified ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-white/15 bg-white/5 text-white/75'
    }`}>
      {verified ? <ShieldCheck size={15} /> : <CircleHelp size={15} />}
      {facility.isDemo ? 'Sample data' : verified ? 'Provider verified' : 'Unverified'}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-[#74767B]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-5 text-[#17191D]">{value}</dd>
    </div>
  );
}

function InfoPanel({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-[#E2DED6] p-4"><h3 className="text-sm font-bold text-[#17191D]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#74767B]">{text}</p></div>;
}

function Input({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[#74767B]">
      {label}
      <input type={type} min={type === 'number' ? '1' : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-[#E2DED6] bg-white px-3 text-sm text-[#17191D] focus:border-[#FF5A1F] focus:outline-none" />
    </label>
  );
}
