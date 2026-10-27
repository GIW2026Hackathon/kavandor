'use client';

import { Search } from 'lucide-react';

export function FacilitySearchForm({
  crop, setCrop,
  quantity, setQuantity,
  location, setLocation,
  county, setCounty,
  harvestDate, setHarvestDate,
  condition, setCondition,
  outcome, setOutcome,
  durationDays, setDurationDays,
  serviceStart, setServiceStart,
}: {
  crop: string; setCrop: (value: string) => void;
  quantity: string; setQuantity: (value: string) => void;
  location: string; setLocation: (value: string) => void;
  county: string; setCounty: (value: string) => void;
  harvestDate: string; setHarvestDate: (value: string) => void;
  condition: string; setCondition: (value: string) => void;
  outcome: string; setOutcome: (value: string) => void;
  durationDays: string; setDurationDays: (value: string) => void;
  serviceStart: string; setServiceStart: (value: string) => void;
}) {
  return (
    <form id="harvest-details" className="mt-6 rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:p-6" onSubmit={(event) => event.preventDefault()}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FFF0EB] text-[#FF5A1F]"><Search size={19} /></span>
        <div>
          <h2 className="text-lg font-bold text-[#17191D]">Suitable for your harvest</h2>
          <p className="mt-1 text-sm leading-5 text-[#74767B]">Use your harvest details to narrow the facility list. Missing provider information stays marked as unknown.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Crop">
          <input value={crop} onChange={(event) => setCrop(event.target.value)} placeholder="e.g. Tomatoes" autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Quantity (kg)">
          <input type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Enter quantity" className={inputClass} />
        </Field>
        <Field label="Farm or collection point">
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Village or nearest town" className={inputClass} />
        </Field>
        <Field label="County">
          <input value={county} onChange={(event) => setCounty(event.target.value)} placeholder="e.g. Kisii" className={inputClass} />
        </Field>
        <Field label="Harvest date">
          <input type="date" value={harvestDate} onChange={(event) => setHarvestDate(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Current condition">
          <select value={condition} onChange={(event) => setCondition(event.target.value)} className={inputClass}>
            <option value="">Select if known</option>
            <option value="Fresh and sound">Fresh and sound</option>
            <option value="Some bruising or damage">Some bruising or damage</option>
            <option value="Needs urgent attention">Needs urgent attention</option>
            <option value="Not assessed">Not assessed</option>
          </select>
        </Field>
        <Field label="What do you want to achieve?">
          <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className={inputClass}>
            <option value="preserve">Preserve produce</option>
            <option value="dry">Dry it</option>
            <option value="process">Process it</option>
            <option value="aggregate">Aggregate for buyers</option>
            <option value="market">Prepare for market</option>
          </select>
        </Field>
        <Field label="Planned service duration (days)">
          <input type="number" min="1" max="60" step="1" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Preferred service start">
          <input type="date" value={serviceStart} onChange={(event) => setServiceStart(event.target.value)} className={inputClass} />
        </Field>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#74767B]">
        Crop compatibility and capacity windows come from facility records. Distance cannot be calculated without verified farm and facility coordinates.
      </p>
    </form>
  );
}

const inputClass = 'h-11 w-full rounded-xl border border-[#E2DED6] bg-white px-3 text-sm text-[#17191D] outline-none transition placeholder:text-[#A5A19A] focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-xs font-bold text-[#74767B]">{label}{children}</label>;
}
