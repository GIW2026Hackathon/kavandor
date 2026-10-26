import Link from 'next/link';
import { ArrowRight, CircleHelp, Eye, Info, TriangleAlert } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { QuantityDisplay } from '@/components/ui/quantity-display';
import { StatusBadge } from '@/components/ui/status-badge';

export const instant = false;

export default async function HarvestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">KV-2026-001 · Registered 26 Oct</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">Tomato harvest intelligence</h1>
          </div>
          <StatusBadge status="assessed" />
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative min-h-72 overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#22252A_0%,#17191D_100%)] border border-[#22252A] shadow-md">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,.15)_0_8%,transparent_9%),linear-gradient(135deg,rgba(255,255,255,.05),rgba(0,0,0,.4))]" />
            <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-[#17191D]/90 p-4 text-white backdrop-blur-md">
              <p className="text-xs font-mono uppercase text-[#FF5A1F]">AI Multimodal Assessment</p>
              <QuantityDisplay quantity={220} unit="kg" />
            </div>
          </div>

          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">AI Computer Vision &amp; Agronomic Triage</p>
                <h2 className="mt-2 text-2xl font-bold text-[#17191D]">Quality Grade: A-Standard</h2>
              </div>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                High Confidence (88%)
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Eye, label: 'Maturity & Firmness', detail: 'Uniform breaker-to-turning maturity stage; firm pulp structure' },
                { icon: TriangleAlert, label: 'Defect Analysis', detail: 'Surface blemishes on <4% of batch; no fungal rot detected' },
                { icon: CircleHelp, label: 'Ambient Shelf Life', detail: '36-48 hours remaining at ambient 22°C before softening' },
                { icon: Info, label: 'Recommended Action', detail: 'Precool to 11-13°C or liquidate to local wholesale within 12h' },
              ].map((item) => (
                <div key={item.label} className="border-t border-[#E2DED6] pt-4">
                  <item.icon size={18} className="text-[#FF5A1F]" />
                  <p className="mt-2 text-sm font-bold text-[#17191D]">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[#74767B]">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.7fr]">
          <section className="rounded-2xl border border-[#00C896]/30 border-l-4 border-l-[#00C896] bg-[#E6F9F4] p-5 sm:p-6">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#008765]">Actionable Preservation Pathway</p>
            <h2 className="mt-2 text-xl font-bold text-[#17191D]">Compare net proceeds across storage and sale channels</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#008765]">
              AI evaluated 3 viable routes: Immediate wholesale liquidation, cold store buffer arbitrage, and solar drying value addition.
            </p>
            <Link href={`/harvests/${id}/compare`} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98">
              Compare options <ArrowRight size={17} />
            </Link>
          </section>
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs">
            <h2 className="font-bold text-[#17191D]">Quality Assurance Protocol</h2>
            <p className="mt-2 text-sm leading-6 text-[#74767B]">
              Field camera appraisal is cross-referenced with regional crop maturity curves. Final grade confirmed at cold room digital intake gate.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
