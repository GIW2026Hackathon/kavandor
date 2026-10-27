import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Clock3, Info, Scale, Warehouse } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { formatCurrency } from '@/lib/currency';
import { getDatabaseAdapter } from '@/lib/database-adapter';
import { PreservationDecisionService } from '@/lib/orchestrator';

export const instant = false;

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDatabaseAdapter();
  let harvest = await db.getHarvestById(id);

  if (!harvest) {
    if (id === 'KV-2026-001') {
      harvest = {
        id: 'KV-2026-001',
        farmerId: 'farmer-demo',
        crop: 'Tomatoes',
        quantity: 220,
        unit: 'kg',
        harvestDate: new Date().toISOString(),
        location: 'Nyakundi Farm, Kisii',
        handlingNotes: 'Harvested at sunrise, sorted into ventilated crates',
        status: 'assessed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      notFound();
    }
  }

  const decisionService = new PreservationDecisionService();
  const evaluation = decisionService.evaluate(harvest);

  const breakEvenUnitPrice = Math.ceil(
    (evaluation.recommendations.find((r) => r.type === 'immediate_sale')?.estimatedNetKES || 0) /
      harvest.quantity +
      3.2 * 7 +
      (150 + 350) / harvest.quantity,
  );

  return (
    <AppShell allowedRoles={['farmer', 'operations_admin']}>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <Link
          href={`/harvests/${harvest.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#74767B] hover:text-[#17191D] transition-colors"
        >
          <ArrowLeft size={16} /> Back to harvest assessment
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
              {harvest.crop} · {harvest.quantity} {harvest.unit} · Lot #{harvest.id.slice(0, 8)}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">
              Compare post-harvest pathways
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74767B]">
              Deterministic net proceeds modeling based on verified regional facility tariffs, transport distance, and platform escrow deductions.
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            Verified Net Proceeds Economics
          </span>
        </div>

        {/* Objective Economic Reality & Risk Notice */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-950">
          <div className="flex items-start gap-3">
            <Info size={20} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-amber-900">Storage Economics & Price Risk Transparency</p>
              <p className="mt-1 leading-6 text-amber-900/90 text-xs sm:text-sm">
                Cold storage preserves crop quality and prevents spoilage, but it is <strong>not guaranteed to be more profitable</strong>. Cold room holding incurs daily energy tariffs (KSh 3.20/kg/day), intake fees, transport, and natural transpiration weight shrinkage (2–4%). To outperform immediate sale, the market price after 7 days must reach at least <strong className="font-mono">KSh {breakEvenUnitPrice}/kg</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          {evaluation.recommendations.map((option) => {
            const isStorage = option.type === 'storage';
            const actionHref = isStorage
              ? `/storage?harvestId=${harvest.id}&crop=${encodeURIComponent(harvest.crop)}&quantity=${harvest.quantity}`
              : option.type === 'immediate_sale'
                ? `/offers?harvestId=${harvest.id}`
                : `/storage?type=drying&harvestId=${harvest.id}&crop=${encodeURIComponent(harvest.crop)}&quantity=${harvest.quantity}`;

            const actionLabel = isStorage
              ? 'Find & reserve cold storage'
              : option.type === 'immediate_sale'
                ? 'Review buyer offers & sell'
                : 'Explore drying & aggregation';

            return (
              <article
                key={option.type}
                className={`flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition shadow-xs ${
                  isStorage
                    ? 'border-2 border-[#FF5A1F] bg-white shadow-md'
                    : 'border border-[#E2DED6] bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-1.5 rounded-full border border-[#00C896]/30 bg-[#E6F9F4] px-3 py-1 text-xs font-bold text-[#008765]">
                      <Check size={14} /> Feasible Pathway
                    </p>
                    {isStorage && (
                      <span className="rounded-md bg-[#FF5A1F]/10 px-2 py-0.5 text-[11px] font-mono font-bold text-[#FF5A1F]">
                        Storage Priority
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-2xl font-bold text-[#17191D]">{option.label}</h2>
                  <p className="mt-1 text-xs leading-5 text-[#74767B]">{option.description}</p>

                  <div className="mt-6 grid grid-cols-3 border-y border-[#E2DED6] py-4 text-sm">
                    <div>
                      <p className="text-xs font-mono uppercase text-[#74767B]">Gross Value</p>
                      <p className="mt-2 font-bold text-[#17191D] font-mono">{formatCurrency(option.grossKES)}</p>
                    </div>
                    <div className="border-x border-[#E2DED6] px-3">
                      <p className="text-xs font-mono uppercase text-[#74767B]">Tariffs & Costs</p>
                      <p className="mt-2 font-bold text-[#17191D] font-mono">−{formatCurrency(option.totalDeductionsKES)}</p>
                    </div>
                    <div className="pl-3">
                      <p className="text-xs font-mono uppercase text-[#74767B]">Estimated Net</p>
                      <p className={`mt-2 text-xl font-extrabold font-mono ${isStorage ? 'text-[#FF5A1F]' : 'text-[#17191D]'}`}>
                        {formatCurrency(option.estimatedNetKES)}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Clock3 size={16} className="mt-0.5 shrink-0 text-[#74767B]" />
                      <dt className="text-[#74767B]">Turnaround</dt>
                      <dd className="ml-auto text-right font-semibold text-[#17191D]">
                        {option.type === 'immediate_sale'
                          ? 'Pickup within 12h'
                          : option.type === 'storage'
                            ? '7-Day Climate Buffer (11–13°C)'
                            : '2-Day Solar Dehydration Hub'}
                      </dd>
                    </div>
                    <div className="flex items-start gap-2 border-t border-[#E2DED6] pt-3">
                      <Warehouse size={16} className="mt-0.5 shrink-0 text-[#74767B]" />
                      <dt className="text-[#74767B]">Capacity Status</dt>
                      <dd className="ml-auto text-right font-semibold text-[#17191D]">
                        {harvest.quantity} {harvest.unit} allocation eligible
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-3 text-xs">
                    <p className="font-bold text-[#17191D] mb-1.5 flex items-center gap-1.5">
                      <Scale size={14} className="text-[#FF5A1F]" /> Modeled Assumptions:
                    </p>
                    <ul className="space-y-1 text-[#74767B]">
                      {option.assumptions.map((assumption, aIdx) => (
                        <li key={aIdx} className="flex items-center gap-1.5">
                          <span className="size-1 rounded-full bg-[#74767B]" /> {assumption}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <Link
                    href={actionHref}
                    className="flex h-11 items-center justify-between rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98"
                  >
                    <span>{actionLabel}</span> <ArrowRight size={17} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
