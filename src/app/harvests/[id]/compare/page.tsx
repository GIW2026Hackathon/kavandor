import Link from 'next/link';
import { ArrowRight, Check, Clock3, CircleHelp } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { calculateNetProceeds } from '@/calculations/netProceeds';
import { demoTomatoOffer, formatCurrency } from '@/components/demo/session';

export default function ComparePage() {
  const saleNet = calculateNetProceeds({ quantity: demoTomatoOffer.quantity, unitPrice: demoTomatoOffer.unitPrice, transportCost: 300, facilityCost: 0, fees: 200 });
  const options = [
    {
      title: 'Sell now',
      subtitle: 'FreshLink Kisii offer',
      revenue: demoTomatoOffer.amount,
      costs: 500,
      net: saleNet,
      timing: 'Collect within 18 hours',
      capacity: 'Confirmed offer quantity',
      status: 'Offer pending',
      assumptions: 'Offer is priced per kg. Transport and handling are estimated before final confirmation.',
    },
    {
      title: 'Short-term storage',
      subtitle: 'Keumbu Produce Centre',
      revenue: 4620,
      costs: 720,
      net: 3900,
      timing: '4–7 days · capacity unconfirmed',
      capacity: 'More information needed',
      status: 'Not yet feasible',
      assumptions: 'Potential sale price, 3-day storage and transport are estimates. No capacity commitment is available.',
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Tomatoes · 220 kg · KV-2026-001</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">Compare next moves</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74767B]">Compare the options using the same quantity and show every deduction.</p>
          </div>
          <span className="rounded-full border border-[#E2DED6] bg-[#FAF9F5] px-3 py-1.5 text-xs font-semibold text-[#74767B]">Demo calculation</span>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          {options.map((option, index) => (
            <article
              key={option.title}
              className={`rounded-2xl border p-5 sm:p-6 transition shadow-xs ${
                index === 0
                  ? 'border-2 border-[#FF5A1F] bg-white shadow-md'
                  : 'border border-[#E2DED6] bg-white'
              }`}
            >
              {index === 0 && (
                <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#00C896]/30 bg-[#E6F9F4] px-3 py-1 text-xs font-bold text-[#008765]">
                  <Check size={14} /> Feasible confirmed offer
                </p>
              )}
              {index === 1 && (
                <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#E2DED6] bg-[#FAF9F5] px-3 py-1 text-xs font-bold text-[#74767B]">
                  <CircleHelp size={14} /> More information needed
                </p>
              )}
              <p className="text-xs font-mono font-bold uppercase text-[#74767B]">{option.subtitle}</p>
              <h2 className="mt-2 text-2xl font-bold text-[#17191D]">{option.title}</h2>
              <div className="mt-6 grid grid-cols-3 border-y border-[#E2DED6] py-4 text-sm">
                <div>
                  <p className="text-xs font-mono uppercase text-[#74767B]">Revenue</p>
                  <p className="mt-2 font-bold text-[#17191D] font-mono">{formatCurrency(option.revenue)}</p>
                </div>
                <div className="border-x border-[#E2DED6] px-3">
                  <p className="text-xs font-mono uppercase text-[#74767B]">Costs</p>
                  <p className="mt-2 font-bold text-[#17191D] font-mono">−{formatCurrency(option.costs)}</p>
                </div>
                <div className="pl-3">
                  <p className="text-xs font-mono uppercase text-[#74767B]">Est. net</p>
                  <p className={`mt-2 text-xl font-extrabold font-mono ${index === 0 ? 'text-[#FF5A1F]' : 'text-[#17191D]'}`}>
                    {formatCurrency(option.net)}
                  </p>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Clock3 size={16} className="mt-0.5 shrink-0 text-[#74767B]" />
                  <dt className="text-[#74767B]">Timing</dt>
                  <dd className="ml-auto text-right font-semibold text-[#17191D]">{option.timing}</dd>
                </div>
                <div className="flex items-start gap-2 border-t border-[#E2DED6] pt-3">
                  <CircleHelp size={16} className="mt-0.5 shrink-0 text-[#74767B]" />
                  <dt className="text-[#74767B]">Capacity</dt>
                  <dd className="ml-auto text-right font-semibold text-[#17191D]">{option.capacity}</dd>
                </div>
              </dl>
              <p className="mt-5 border-l-2 border-[#FF5A1F]/40 pl-3 text-xs leading-5 text-[#74767B]">{option.assumptions}</p>
              {index === 0 ? (
                <Link href="/offers" className="mt-6 flex h-11 items-center justify-between rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98">
                  <span>Review buyer offer</span> <ArrowRight size={17} />
                </Link>
              ) : (
                <button type="button" disabled className="mt-6 h-11 w-full rounded-xl border border-[#E2DED6] bg-[#FAF9F5] text-sm font-bold text-[#74767B] opacity-60">
                  Not enough verified data
                </button>
              )}
            </article>
          ))}
        </div>
        <div className="mt-8"><DemoNotice>Illustrative demo only. Confirmed offer terms and provider capacity must be re-validated in live use.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
