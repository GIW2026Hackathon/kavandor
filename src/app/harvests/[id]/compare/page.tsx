import Link from 'next/link';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Info, Scale, Warehouse, Sparkles, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { formatCurrency } from '@/lib/currency';
import { getDatabaseAdapter } from '@/lib/database-adapter';
import { ValueAdditionEngine, type ValueAdditionPathway } from '@/lib/value-addition-engine';

export const instant = false;

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
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

  const evaluation = ValueAdditionEngine.evaluatePathways({
    crop: harvest.crop,
    quantity: Number(harvest.quantity),
    unit: harvest.unit,
    location: harvest.location,
    handlingNotes: harvest.handlingNotes || undefined,
  });

  const pathways: ValueAdditionPathway[] = evaluation.pathways;

  // Calculate dynamic storage break-even if storage pathway exists
  const storagePathway = pathways.find((p) => p.type === 'storage');
  const immediatePathway = pathways.find((p) => p.type === 'immediate_sale');
  const breakEvenUnitPrice = storagePathway?.breakEvenTargetPriceKES || Math.ceil(
    ((immediatePathway?.estimatedNetKES || 0) + 350 + 150 + harvest.quantity * 3.2 * 7) / (harvest.quantity * 0.97)
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
              Compare Value-Addition Pathways
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74767B]">
              Side-by-side economic modeling across direct sale, processing, cold holding, drying, aggregation, and grading. Ranking is strictly determined by objective suitability scores.
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            Deterministic Net Proceeds Modeling
          </span>
        </div>

        {/* Objective Economic Reality & Risk Notice */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-950">
          <div className="flex items-start gap-3">
            <Info size={20} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-amber-900">Economic Reality &amp; Storage Tradeoffs</p>
              <p className="mt-1 leading-6 text-amber-900/90 text-xs sm:text-sm">
                Storage preserves shelf life but incurs daily tariffs (KSh 3.20/kg/day), intake fees, transport, and 3% natural moisture transpiration. For cold holding to outperform immediate sale, the market price post-holding must exceed <strong className="font-mono">KSh {breakEvenUnitPrice}/kg</strong>. When produce is already ripe or market prices are volatile, cottage processing (puree/sauce) or collective aggregation frequently yields higher net proceeds.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pathways.map((option, idx) => {
            const isTop = idx === 0;
            const isHighlyRecommended = option.suitabilityTier === 'highly_recommended';

            return (
              <article
                key={`${option.type}-${idx}`}
                className={`flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition shadow-xs ${
                  isTop
                    ? 'border-2 border-[#FF5A1F] bg-white shadow-md'
                    : 'border border-[#E2DED6] bg-white hover:border-[#17191D]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isHighlyRecommended
                        ? 'border border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border border-[#00C896]/30 bg-[#E6F9F4] text-[#008765]'
                    }`}>
                      <CheckCircle2 size={13} /> {option.suitabilityScore ? `${option.suitabilityScore}% Suitability` : 'Feasible'}
                    </p>
                    {isTop && (
                      <span className="rounded-md bg-[#FF5A1F] px-2 py-0.5 text-[10px] font-mono font-bold text-white uppercase">
                        Rank #1
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-xl font-bold text-[#17191D]">{option.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-[#74767B]">{option.description}</p>

                  {/* Transformation recovery */}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#FAF9F5] border border-[#E2DED6] px-3 py-2 text-xs">
                    <span className="flex items-center gap-1 text-[#17191D] font-bold">
                      <Sparkles size={13} className="text-[#FF5A1F]" /> Output Yield
                    </span>
                    <span className="font-mono font-bold text-[#17191D]">
                      {option.yieldRetentionPercent}% ({option.outputQuantity} {option.outputUnit})
                    </span>
                  </div>

                  {/* Financial figures */}
                  <div className="mt-4 grid grid-cols-3 border-y border-[#E2DED6] py-3.5 text-xs">
                    <div>
                      <p className="text-[10px] font-mono uppercase text-[#74767B]">Gross</p>
                      <p className="mt-1 font-bold text-[#17191D] font-mono">
                        {option.grossRevenueKES ? formatCurrency(option.grossRevenueKES) : 'Quote req.'}
                      </p>
                    </div>
                    <div className="border-x border-[#E2DED6] px-2">
                      <p className="text-[10px] font-mono uppercase text-[#74767B]">Costs</p>
                      <p className="mt-1 font-bold text-[#17191D] font-mono">
                        {option.totalDeductionsKES !== undefined ? `−${formatCurrency(option.totalDeductionsKES)}` : 'Tariff quote'}
                      </p>
                    </div>
                    <div className="pl-2">
                      <p className="text-[10px] font-mono uppercase text-[#74767B]">Est. Net</p>
                      <p className={`mt-1 text-sm font-extrabold font-mono ${isTop ? 'text-[#FF5A1F]' : 'text-[#17191D]'}`}>
                        {option.estimatedNetKES ? formatCurrency(option.estimatedNetKES) : 'Subject to quote'}
                      </p>
                    </div>
                  </div>

                  {/* Matched Provider Information */}
                  {option.matchedProvider && (
                    <div className="mt-4 rounded-xl border border-[#00C896]/30 bg-[#E6F9F4]/60 p-3 text-xs">
                      <p className="font-bold text-[#008765] flex items-center gap-1">
                        <ShieldCheck size={13} /> {option.matchedProvider.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#74767B]">
                        {option.matchedProvider.locality} · {option.matchedProvider.serviceName}
                      </p>
                      <p className="mt-1 text-[11px] font-mono font-bold text-[#17191D]">
                        Rate: {option.matchedProvider.pricingSummary}
                      </p>
                    </div>
                  )}

                  {/* Modeled Assumptions */}
                  <div className="mt-4 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-3 text-xs">
                    <p className="font-bold text-[#17191D] mb-1.5 flex items-center gap-1.5">
                      <Scale size={13} className="text-[#FF5A1F]" /> Assumptions:
                    </p>
                    <ul className="space-y-1 text-[#74767B] text-[11px]">
                      {option.assumptions.slice(0, 3).map((assumption, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-1.5">
                          <span className="size-1 rounded-full bg-[#74767B] mt-1 shrink-0" />
                          <span>{assumption}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-2">
                  <Link
                    href={option.actionHref || `/storage?harvestId=${harvest.id}`}
                    className={`flex h-10 items-center justify-between rounded-xl px-4 text-xs font-bold transition active:scale-98 ${
                      isTop
                        ? 'bg-[#FF5A1F] hover:bg-[#E44E18] text-white shadow-xs'
                        : 'border border-[#E2DED6] bg-white text-[#17191D] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <span>{option.actionLabel || 'Proceed with Pathway'}</span> <ArrowRight size={14} />
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
