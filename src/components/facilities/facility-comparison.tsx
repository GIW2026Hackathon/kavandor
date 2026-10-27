'use client';

import { estimateServiceCost, facilityBenefit, facilityCategory, getMatchingSlot } from '@/lib/facility-discovery';
import type { Facility } from '@/types/facility';

export function FacilityComparison({
  facilities,
  quantityKg,
  durationDays,
  serviceStart,
  harvestDate,
  onClear,
}: {
  facilities: Facility[];
  quantityKg: number;
  durationDays: number;
  serviceStart: string;
  harvestDate: string;
  onClear: () => void;
}) {
  if (facilities.length === 0) return null;
  return (
    <section className="mt-8 rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:p-6" aria-labelledby="comparison-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Compare outcomes</p>
          <h2 id="comparison-title" className="mt-1 text-xl font-bold text-[#17191D]">What each option may help you achieve</h2>
        </div>
        <button type="button" onClick={onClear} className="min-h-11 px-3 text-sm font-bold text-[#74767B] hover:text-[#17191D]">Clear comparison</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {facilities.map((facility) => {
          const cost = estimateServiceCost(facility, quantityKg, durationDays);
          return (
            <article key={facility.id} className="rounded-xl border border-[#E2DED6] p-4">
              <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">{facilityCategory(facility)}</p>
              <h3 className="mt-2 font-bold text-[#17191D]">{facility.name}</h3>
              <p className="mt-3 text-sm leading-6 text-[#74767B]">{facilityBenefit(facility).summary}</p>
              <dl className="mt-4 space-y-3 border-t border-[#E2DED6] pt-4 text-sm">
                <CompareRow label="Service fee" value={cost === null ? 'Not provided' : `Est. KSh ${Math.round(cost).toLocaleString('en-KE')}`} />
                <CompareRow label="Transport" value="Not provided" />
                <CompareRow label="Expected output" value="Not provided" />
                <CompareRow label="Estimated net return" value="Cannot estimate — market price and full costs are missing" />
                <CompareRow label="Capacity and dates" value={getMatchingSlot(facility, serviceStart, durationDays, quantityKg, harvestDate) ? 'Matching slot listed; provider confirmation required' : 'Confirmation required'} />
              </dl>
            </article>
          );
        })}
      </div>
      <p className="mt-4 rounded-xl bg-[#F6F3EC] p-4 text-xs leading-5 text-[#74767B]">
        Any displayed fee estimate uses the listed provider price and your entered quantity/duration only. Transport, yield, selling price, losses and other charges are excluded; no profit or price increase is promised.
      </p>
    </section>
  );
}

function CompareRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#74767B]">{label}</dt>
      <dd className="mt-1 break-words text-xs font-semibold leading-5 text-[#17191D]">{value}</dd>
    </div>
  );
}
