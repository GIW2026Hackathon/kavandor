import Link from 'next/link';
import { ArrowRight, Check, Clock3, Warehouse } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { calculateNetProceeds } from '@/calculations/netProceeds';
import { activeWholesaleOffer } from '@/data/market';
import { formatCurrency } from '@/lib/currency';

export const instant = false;

export default function ComparePage() {
  const saleNet = calculateNetProceeds({ quantity: activeWholesaleOffer.quantity, unitPrice: activeWholesaleOffer.unitPrice, transportCost: 300, facilityCost: 0, fees: 200 });
  const storageNet = calculateNetProceeds({ quantity: 220, unitPrice: 61, transportCost: 350, facilityCost: 150, fees: 268, storageCost: 4928 });

  const options = [
    {
      title: 'Direct Wholesale Liquidation',
      subtitle: 'Verified Institutional Buyer',
      revenue: activeWholesaleOffer.amount,
      costs: 500,
      net: saleNet,
      timing: 'Collection within 12 hours',
      capacity: 'Full 220 kg allocation confirmed',
      status: 'Active Purchase Offer',
      assumptions: 'Offer priced at KES 45/kg. Transport KES 300, platform fee KES 200 deducted at escrow settlement.',
      actionHref: '/offers',
      actionLabel: 'Review buyer offer',
    },
    {
      title: 'Cold Storage Buffer (7 Days)',
      subtitle: 'Kisii Central Cold Store Hub',
      revenue: 220 * 61,
      costs: 350 + 150 + 268 + 4928,
      net: storageNet,
      timing: '7 Days Hold · 11-13°C Pre-cooled',
      capacity: '840 kg headroom available',
      status: 'Capacity Available',
      assumptions: 'Projected held price KES 61/kg after mid-week supply dip. Tariff KES 3.20/kg/day.',
      actionHref: '/storage/facility-01/request',
      actionLabel: 'Reserve cold capacity',
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Tomatoes · 220 kg · KV-2026-001</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">Compare preservation pathways</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74767B]">Real-time net proceeds modeled with verified transport tariffs and storage fees.</p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            Net Proceeds Economics
          </span>
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
              <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#00C896]/30 bg-[#E6F9F4] px-3 py-1 text-xs font-bold text-[#008765]">
                <Check size={14} /> Feasible Verified Pathway
              </p>
              <p className="text-xs font-mono font-bold uppercase text-[#74767B]">{option.subtitle}</p>
              <h2 className="mt-2 text-2xl font-bold text-[#17191D]">{option.title}</h2>
              <div className="mt-6 grid grid-cols-3 border-y border-[#E2DED6] py-4 text-sm">
                <div>
                  <p className="text-xs font-mono uppercase text-[#74767B]">Gross Revenue</p>
                  <p className="mt-2 font-bold text-[#17191D] font-mono">{formatCurrency(option.revenue)}</p>
                </div>
                <div className="border-x border-[#E2DED6] px-3">
                  <p className="text-xs font-mono uppercase text-[#74767B]">Deductions</p>
                  <p className="mt-2 font-bold text-[#17191D] font-mono">−{formatCurrency(option.costs)}</p>
                </div>
                <div className="pl-3">
                  <p className="text-xs font-mono uppercase text-[#74767B]">Estimated Net</p>
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
                  <Warehouse size={16} className="mt-0.5 shrink-0 text-[#74767B]" />
                  <dt className="text-[#74767B]">Capacity</dt>
                  <dd className="ml-auto text-right font-semibold text-[#17191D]">{option.capacity}</dd>
                </div>
              </dl>
              <p className="mt-5 border-l-2 border-[#FF5A1F]/40 pl-3 text-xs leading-5 text-[#74767B]">{option.assumptions}</p>
              <Link
                href={option.actionHref}
                className="mt-6 flex h-11 items-center justify-between rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98"
              >
                <span>{option.actionLabel}</span> <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
