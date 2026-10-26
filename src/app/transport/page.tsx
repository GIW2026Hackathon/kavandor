import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

export default function TransportOverviewPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Collections and delivery" title="Transport & collections" description="Track demo pickup and delivery requests separately from storage confirmation." />
        <section className="mt-7 rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-[#17191D] text-[#FF5A1F] shadow-sm">
              <Truck size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">Songa Mobility · demo only</p>
              <h2 className="mt-1 text-xl font-bold text-[#17191D]">Tomatoes · 220 kg</h2>
              <p className="mt-1 text-sm text-[#74767B]">Nyakundi farm to Kisii Cold Store Demo</p>
            </div>
            <span className="rounded-full border border-[#FF5A1F]/30 bg-[#FFF0EB] px-3 py-1 text-xs font-bold text-[#FF5A1F]">
              Quote pending
            </span>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#E2DED6] pt-5 sm:flex-row">
            <Link href="/transport/requests/SONGA-DEMO-001" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98">
              Track demo transport <ArrowRight size={16} />
            </Link>
            <Link href="/storage/requests" className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs">
              View storage request
            </Link>
          </div>
        </section>
        <div className="mt-8"><DemoNotice>No vehicle, quote or dispatch has been confirmed. No authorised Songa Mobility integration is connected.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
