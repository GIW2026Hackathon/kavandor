'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertCircle, Warehouse, Sparkles, Scale, ShieldCheck, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { ValueAdditionPathway } from '@/lib/value-addition-engine';

interface PathwayCardProps {
  pathway: ValueAdditionPathway;
  harvestId: string;
  isTopRecommendation?: boolean;
}

export function PathwayCard({ pathway, harvestId, isTopRecommendation }: PathwayCardProps) {
  const isHighlyRecommended = pathway.suitabilityTier === 'highly_recommended' || (pathway.suitabilityScore && pathway.suitabilityScore >= 85);
  const isRequiresVerification = pathway.suitabilityTier === 'requires_verification';

  const tierBadge = isHighlyRecommended ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
      <CheckCircle2 size={13} className="text-emerald-600" /> Highly Recommended ({pathway.suitabilityScore}%)
    </span>
  ) : isRequiresVerification ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
      <AlertCircle size={13} className="text-amber-600" /> Requires Verification ({pathway.suitabilityScore}%)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-800">
      Feasible Pathway ({pathway.suitabilityScore}%)
    </span>
  );

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition shadow-xs ${
        isTopRecommendation
          ? 'border-2 border-[#FF5A1F] bg-white shadow-md'
          : 'border-[#E2DED6] bg-white hover:border-[#17191D]'
      }`}
    >
      <div>
        {/* Badges Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {tierBadge}
            {isTopRecommendation && (
              <span className="rounded-md bg-[#FF5A1F] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Top Value Pick
              </span>
            )}
          </div>
          <span className="rounded-md bg-[#FAF9F5] border border-[#E2DED6] px-2 py-0.5 text-[11px] font-mono font-semibold text-[#74767B]">
            {pathway.badge}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="mt-3 text-xl font-extrabold text-[#17191D]">{pathway.title}</h3>
        <p className="mt-1 text-xs leading-5 text-[#74767B]">{pathway.description}</p>

        {/* Yield Retention / Transformation Indicator */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#FAF9F5] border border-[#E2DED6] px-3.5 py-2.5 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-[#17191D]">
            <Sparkles size={14} className="text-[#FF5A1F]" /> Yield Transformation
          </span>
          <span className="font-mono font-semibold text-[#17191D]">
            {pathway.yieldRetentionPercent}% output ({pathway.outputQuantity} {pathway.outputUnit})
          </span>
        </div>

        {/* Financial Numbers Grid */}
        <div className="mt-4 grid grid-cols-3 border-y border-[#E2DED6] py-3.5 text-xs">
          <div>
            <p className="font-mono uppercase text-[#74767B] text-[10px]">Gross Revenue</p>
            <p className="mt-1 font-bold font-mono text-sm text-[#17191D]">
              {pathway.grossRevenueKES ? formatCurrency(pathway.grossRevenueKES) : 'Subject to quote'}
            </p>
          </div>
          <div className="border-x border-[#E2DED6] px-3">
            <p className="font-mono uppercase text-[#74767B] text-[10px]">Costs &amp; Tariffs</p>
            <p className="mt-1 font-bold font-mono text-sm text-[#17191D]">
              {pathway.totalDeductionsKES !== undefined ? `−${formatCurrency(pathway.totalDeductionsKES)}` : 'Tariff quote'}
            </p>
          </div>
          <div className="pl-3">
            <p className="font-mono uppercase text-[#74767B] text-[10px]">Estimated Net</p>
            <p className="mt-1 font-extrabold font-mono text-base text-[#FF5A1F]">
              {pathway.estimatedNetKES ? formatCurrency(pathway.estimatedNetKES) : 'Quote required'}
            </p>
          </div>
        </div>

        {/* Break-even Warning if applicable */}
        {pathway.breakEvenTargetPriceKES && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-900 flex items-center gap-2">
            <Scale size={14} className="shrink-0 text-amber-700" />
            <span>
              Break-even target price: <strong>KSh {pathway.breakEvenTargetPriceKES}/kg</strong> to outperform immediate wholesale liquidation.
            </span>
          </div>
        )}

        {/* Matched Regional Provider */}
        {pathway.matchedProvider && (
          <div className="mt-4 rounded-xl border border-[#00C896]/30 bg-[#E6F9F4]/70 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-bold text-[#008765]">
                <ShieldCheck size={14} /> Matched Regional Provider
              </span>
              <span className="text-[10px] font-mono text-[#008765] uppercase">Verified Facility</span>
            </div>
            <p className="mt-1 font-extrabold text-[#17191D]">{pathway.matchedProvider.name}</p>
            <p className="text-[11px] text-[#74767B] flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-[#74767B]" /> {pathway.matchedProvider.locality} · {pathway.matchedProvider.serviceName}
            </p>
            <p className="mt-1 text-[11px] font-mono font-bold text-[#17191D]">
              Tariff: {pathway.matchedProvider.pricingSummary}
            </p>
          </div>
        )}

        {/* Assumptions & Unknowns Disclosures */}
        <div className="mt-4 space-y-1.5 text-[11px]">
          {pathway.assumptions && pathway.assumptions.length > 0 && (
            <div className="text-[#74767B]">
              <span className="font-semibold text-[#17191D]">Assumptions:</span>{' '}
              {pathway.assumptions.join(' · ')}
            </div>
          )}
          {pathway.unknowns && pathway.unknowns.length > 0 && (
            <div className="text-amber-800 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
              <span className="font-bold">Required at intake:</span> {pathway.unknowns.join('; ')}
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-5 pt-3 border-t border-[#E2DED6]">
        <Link
          href={pathway.actionHref || `/value-addition?harvestId=${harvestId}`}
          className={`flex h-11 items-center justify-between rounded-xl px-5 text-xs font-bold transition active:scale-98 ${
            isTopRecommendation
              ? 'bg-[#FF5A1F] hover:bg-[#E44E18] text-white shadow-sm'
              : 'border border-[#E2DED6] bg-white text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs'
          }`}
        >
          <span>{pathway.actionLabel || 'Select Pathway'}</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
