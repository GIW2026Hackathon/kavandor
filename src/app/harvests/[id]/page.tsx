import Link from 'next/link';
import { ArrowRight, CircleHelp, Eye, Info, TriangleAlert } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { QuantityDisplay } from '@/components/ui/quantity-display';
import { StatusBadge } from '@/components/ui/status-badge';

export default function HarvestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  void params;
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase text-[#3E594B]">KV-2026-001 · Registered 26 Oct</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Tomato harvest intelligence</h1></div>
          <StatusBadge status="assessed" />
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative min-h-72 overflow-hidden bg-[#76AC3C]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,.22)_0_8%,transparent_9%),linear-gradient(135deg,rgba(255,255,255,.08),rgba(32,33,31,.22))]" />
            <div className="absolute bottom-4 left-4 right-4 bg-[#004A25]/90 p-4 text-white"><p className="text-xs text-white/60">Visible-condition demo image</p><QuantityDisplay quantity={220} unit="kg" /></div>
          </div>

          <section className="border border-[#004A25]/10 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-[#3E594B]">Observed from photos</p><h2 className="mt-2 text-2xl font-bold">Assessment ready</h2></div><span className="rounded-full bg-[#EDF5DF] px-3 py-1 text-xs font-bold text-[#004A25]">Moderate confidence</span></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Eye, label: 'Visible condition', detail: 'Mostly firm fruit with mixed colour' },
                { icon: TriangleAlert, label: 'Possible concern', detail: 'Surface blemishes detected on some fruit' },
                { icon: CircleHelp, label: 'Remains unknown', detail: 'Internal quality and moisture content' },
                { icon: Info, label: 'Verify in field', detail: 'Sample firmness, pest damage and odour' },
              ].map((item) => <div key={item.label} className="border-t border-[#004A25]/10 pt-4"><item.icon size={18} className="text-[#76AC3C]" /><p className="mt-3 text-sm font-bold">{item.label}</p><p className="mt-1 text-sm leading-6 text-[#3E594B]">{item.detail}</p></div>) }
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.7fr]">
          <section className="border-l-2 border-[#76AC3C] bg-[#EDF5DF] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase text-[#76AC3C]">Recommended next step</p>
            <h2 className="mt-2 text-xl font-bold">Compare feasible options before confirming a sale</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#004A25]">The visible assessment is preliminary and should be checked in the field. Use the recorded quantity and current offers to compare the next move.</p>
            <Link href="/harvests/demo-harvest-001/compare" className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-[#004A25] px-4 text-sm font-bold text-white">Compare options <ArrowRight size={17} /></Link>
          </section>
          <section className="border border-[#004A25]/10 bg-white p-5">
            <h2 className="font-bold">Assessment limitation</h2>
            <p className="mt-2 text-sm leading-6 text-[#3E594B]">A photograph cannot reliably establish contamination, food safety, exact shelf life or internal quality.</p>
          </section>
        </div>
        <div className="mt-6"><DemoNotice>Simulated AI assessment for demonstration. These observations are not a diagnosis.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
