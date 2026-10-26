import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

export default function TransportOverviewPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Collections and delivery" title="Transport & collections" description="Track demo pickup and delivery requests separately from storage confirmation." />
        <section className="mt-7 border border-[#004A25]/10 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4"><span className="grid size-12 place-items-center rounded-lg bg-[#004A25] text-[#F2C303]"><Truck size={22} /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase text-[#76AC3C]">Songa Mobility · demo only</p><h2 className="mt-2 text-xl font-bold">Tomatoes · 220 kg</h2><p className="mt-1 text-sm text-[#3E594B]">Nyakundi farm to Kisii Cold Store Demo</p></div><span className="rounded-full bg-[#FFF4C5] px-3 py-1 text-xs font-bold">Quote pending</span></div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#004A25]/10 pt-5 sm:flex-row"><Link href="/transport/requests/SONGA-DEMO-001" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#004A25] px-4 text-sm font-bold text-white">Track demo transport <ArrowRight size={16} /></Link><Link href="/storage/requests" className="flex h-11 items-center justify-center rounded-lg border border-[#004A25]/15 px-4 text-sm font-bold">View storage request</Link></div>
        </section>
        <div className="mt-6"><DemoNotice>No vehicle, quote or dispatch has been confirmed. No authorised Songa Mobility integration is connected.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
