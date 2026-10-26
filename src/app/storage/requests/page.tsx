import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

export default function StorageRequestsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Post-harvest" title="Storage requests" description="Track requests awaiting facility review or delivery." />
        <section className="mt-7 border border-[#004A25]/10 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><span className="rounded-full bg-[#FFF4C5] px-3 py-1 text-xs font-bold text-[#004A25]">Awaiting facility review</span><h2 className="mt-4 text-xl font-bold">Tomatoes · 220 kg</h2><p className="mt-1 text-sm text-[#3E594B]">STORAGE-DEMO-001 · Kisii Cold Store Demo</p><p className="mt-3 text-sm leading-6 text-[#3E594B]">Requested arrival 27 Oct 2026 · estimated storage KSh 4,928 · demo record</p></div><div className="text-left sm:text-right"><p className="text-xs text-[#3E594B]">Transport</p><p className="mt-1 font-bold">Songa · quote pending</p></div></div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#004A25]/10 pt-5 sm:flex-row"><Link href="/storage/requests/storage-request-001" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#004A25] px-4 text-sm font-bold text-white">View request <ArrowRight size={16} /></Link><Link href="/transport/requests/SONGA-DEMO-001" className="flex h-11 items-center justify-center rounded-lg border border-[#004A25]/15 px-4 text-sm font-bold">Track transport</Link></div>
        </section>
        <div className="mt-6"><DemoNotice>Seeded request shown until a live booking is connected.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
