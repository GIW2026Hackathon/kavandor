import { Check, GitCompare, MapPin, ShieldCheck } from 'lucide-react';
import type { Facility } from '@/types/facility';
import { facilityCategory, facilityBenefit, formatFacilityPrice, getMatchingSlot, getServiceConditions } from '@/lib/facility-discovery';

export function FacilityCard({
  facility,
  quantityKg,
  harvestDate,
  condition,
  serviceStart,
  durationDays,
  recommended,
  compared,
  onCompare,
  onReview,
}: {
  facility: Facility;
  quantityKg: number;
  harvestDate: string;
  condition: string;
  serviceStart: string;
  durationDays: number;
  recommended: boolean;
  compared: boolean;
  onCompare: () => void;
  onReview: () => void;
}) {
  const slot = getMatchingSlot(facility, serviceStart, durationDays, quantityKg, harvestDate);
  const listedCapacity = slot ?? facility.availabilitySlots.find((item) => item.availableCapacityKg > 0) ?? null;
  const conditions = getServiceConditions(facility);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs transition hover:border-[#FF5A1F] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">{facilityCategory(facility)}</p>
          <h3 className="mt-2 text-xl font-bold text-[#17191D]">{facility.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#74767B]">
            <MapPin size={15} className="shrink-0 text-[#FF5A1F]" />
            {facility.location}, {facility.county}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
          facility.isDemo
            ? 'border-[#E2DED6] bg-[#FAF9F5] text-[#74767B]'
            : facility.verificationStatus === 'verified'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}>
          {facility.isDemo ? 'Sample data' : facility.verificationStatus === 'verified' ? 'Provider verified' : 'Not verified'}
        </span>
      </div>
      {recommended && <p className="mt-3 inline-flex w-fit rounded-full bg-[#FFF0EB] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#C74417]">Suitable for your intended outcome</p>}

      <p className="mt-4 text-sm leading-6 text-[#74767B]">{facility.description || facilityBenefit(facility).summary}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#F6F3EC] p-4 sm:grid-cols-4">
        <Metric label="Distance" value="Not provided" />
        <Metric
          label="Listed capacity"
          value={listedCapacity ? `${listedCapacity.availableCapacityKg.toLocaleString()} kg` : 'Not provided'}
        />
        <Metric label="Service price" value={formatFacilityPrice(facility)} />
        <Metric
          label="Availability"
          value={slot ? 'Fits entered quantity and dates' : facility.availabilitySlots.length ? 'No slot fits quantity and dates' : 'Not provided'}
        />
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <InfoRow label="Accepted crops" value={facility.acceptedCommodities.length ? facility.acceptedCommodities.join(', ') : 'Not provided'} />
        <InfoRow label="Services" value={[facility.type, facility.facilityType].filter(Boolean).join(' · ') || 'Not provided'} />
        <InfoRow label="Harvest condition" value={condition ? `Your report: ${condition}. Facility conditions: ${conditions || 'not provided; confirm suitability'}` : 'Not provided'} />
        <InfoRow label="Conditions and handling" value={conditions || 'Not provided; confirm with provider'} />
        <InfoRow
          label="Last availability update"
          value={facility.availabilityUpdatedAt ? new Date(facility.availabilityUpdatedAt).toLocaleString('en-KE') : 'Not provided'}
        />
      </dl>

      <div className="mt-5 rounded-xl border border-[#E2DED6] border-l-4 border-l-[#FF5A1F] bg-[#FAF9F5] p-4">
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#17191D]">What will I gain?</p>
        <p className="mt-2 text-sm leading-6 text-[#74767B]">{facilityBenefit(facility).summary}</p>
        <p className="mt-2 text-xs leading-5 text-[#74767B]">{facilityBenefit(facility).limitation}</p>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <button
          type="button"
          onClick={onReview}
          className="h-11 flex-1 rounded-xl bg-[#FF5A1F] px-4 text-sm font-bold text-white transition hover:bg-[#E44E18]"
        >
          Review facility
        </button>
        <button
          type="button"
          onClick={onCompare}
          aria-pressed={compared}
          className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
            compared ? 'border-[#FF5A1F] bg-[#FFF0EB] text-[#C74417]' : 'border-[#E2DED6] text-[#17191D] hover:bg-[#F6F3EC]'
          }`}
        >
          {compared ? <Check size={16} /> : <GitCompare size={16} />}
          Compare
        </button>
      </div>
      {facility.verificationStatus === 'verified' && !facility.isDemo && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-800">
          <ShieldCheck size={14} /> Provider verification is recorded; capacity still requires confirmation.
        </p>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-mono font-bold uppercase tracking-wide text-[#74767B]">{label}</p>
      <p className="mt-1 break-words text-xs font-bold text-[#17191D]">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[#E2DED6] pb-2 last:border-b-0 sm:grid-cols-[145px_1fr] sm:gap-3">
      <dt className="text-xs font-semibold text-[#74767B]">{label}</dt>
      <dd className="text-xs leading-5 text-[#17191D]">{value}</dd>
    </div>
  );
}
