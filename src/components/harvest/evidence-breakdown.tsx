'use client';

import { useState } from 'react';
import { Eye, UserCheck, ShieldCheck, Calculator, AlertTriangle, Layers } from 'lucide-react';
import type { EvidenceModel } from '@/lib/value-addition-engine';

interface EvidenceBreakdownProps {
  evidence?: EvidenceModel;
  className?: string;
}

export function EvidenceBreakdown({ evidence, className = '' }: EvidenceBreakdownProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'visual' | 'farmer' | 'provider' | 'estimates' | 'unknowns'>('all');

  if (!evidence) {
    return null;
  }

  const sections = [
    {
      id: 'visual',
      label: 'Visual Observations',
      icon: Eye,
      count: evidence.visualObservations?.length || 0,
      items: evidence.visualObservations || [],
      color: 'text-indigo-600',
      badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      description: 'Physical attributes, skin condition, firmness, and visible defect appraisals.',
    },
    {
      id: 'farmer',
      label: 'Farmer-Reported Facts',
      icon: UserCheck,
      count: evidence.farmerReportedFacts?.length || 0,
      items: evidence.farmerReportedFacts || [],
      color: 'text-blue-600',
      badgeBg: 'bg-blue-50 border-blue-200 text-blue-800',
      description: 'Farmer-declared load size, harvest timestamp, farmgate location, and crate handling.',
    },
    {
      id: 'provider',
      label: 'Verified Provider Info',
      icon: ShieldCheck,
      count: evidence.verifiedProviderInfo?.length || 0,
      items: evidence.verifiedProviderInfo || [],
      color: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      description: 'Directly verified tariffs, operating capacities, and active regional off-take contracts.',
    },
    {
      id: 'estimates',
      label: 'Estimates & Projections',
      icon: Calculator,
      count: evidence.estimates?.length || 0,
      items: evidence.estimates || [],
      color: 'text-amber-600',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
      description: 'Deterministic cost models, yield changes, and break-even price targets.',
    },
    {
      id: 'unknowns',
      label: 'Unknowns & Gaps',
      icon: AlertTriangle,
      count: evidence.unknowns?.length || 0,
      items: evidence.unknowns || [],
      color: 'text-[#74767B]',
      badgeBg: 'bg-neutral-100 border-neutral-300 text-neutral-800',
      description: 'Information required at physical intake scale before final trade execution.',
    },
  ];

  const filteredSections = activeTab === 'all'
    ? sections
    : sections.filter((s) => s.id === activeTab);

  return (
    <section className={`rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#FF5A1F]" />
            <h3 className="text-base font-extrabold text-[#17191D]">
              Evidence &amp; Assumptions Transparency
            </h3>
          </div>
          <p className="mt-1 text-xs text-[#74767B]">
            KAVANDOR strictly separates observed facts from verified provider rates and economic models.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1 bg-[#FAF9F5] p-1 rounded-xl border border-[#E2DED6]">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              activeTab === 'all' ? 'bg-white shadow-2xs text-[#17191D]' : 'text-[#74767B] hover:text-[#17191D]'
            }`}
          >
            All Evidence
          </button>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveTab(s.id as any)}
              className={`rounded-lg px-2 py-1 text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === s.id ? 'bg-white shadow-2xs text-[#17191D]' : 'text-[#74767B] hover:text-[#17191D]'
              }`}
            >
              <span>{s.label.split(' ')[0]}</span>
              <span className="text-[10px] opacity-75 font-mono">({s.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              className="flex flex-col rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-4 text-xs transition hover:bg-white hover:shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#E2DED6]/70 pb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-[#17191D]">
                  <Icon size={15} className={sec.color} />
                  <span>{sec.label}</span>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold ${sec.badgeBg}`}>
                  {sec.count}
                </span>
              </div>

              <p className="mt-2 text-[11px] leading-4 text-[#74767B]">
                {sec.description}
              </p>

              <ul className="mt-3 flex-1 space-y-1.5 pt-1">
                {sec.items.length > 0 ? (
                  sec.items.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-neutral-800 leading-4">
                      <span className="mt-1 size-1 rounded-full bg-neutral-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="italic text-[#74767B]">None recorded</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
