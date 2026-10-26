import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';

export const instant = false;

export default async function StorageRequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  await params;
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
        <p className="text-xs font-bold uppercase text-[#3E594B]">STORAGE-DEMO-001 · Demo</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Storage request</h1>
        <div className="mt-7 grid gap-6 md:grid-cols-[1fr_320px]">
          <section className="border border-[#004A25]/10 bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Tomatoes · 220 kg</h2><span className="rounded-full bg-[#FFF4C5] px-3 py-1 text-xs font-bold">Awaiting facility review</span></div><div className="mt-6 space-y-4 text-sm"><Row label="Facility" value="Kisii Cold Store Demo" /><Row label="Arrival" value="27 Oct 2026, 08:00" /><Row label="Duration" value="7 demo days" /><Row label="Storage estimate" value="KSh 4,928" /><Row label="Transport" value="Songa demo · quote pending" /></div><p className="mt-6 border-l-2 border-[#76AC3C] pl-4 text-sm leading-6 text-[#3E594B]">The facility has not confirmed this request. Transport is separate and should not be represented as a dispatch.</p></section>
          <aside className="h-fit bg-[#004A25] p-5 text-white"><p className="text-xs font-bold uppercase text-[#F2C303]">Next action</p><h2 className="mt-3 text-xl font-bold">Await facility review</h2><p className="mt-2 text-sm leading-6 text-[#FFFFFF]/65">The operator will confirm or change the allocated quantity and start date.</p><Link href="/transport/requests/SONGA-DEMO-001" className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-bold">View transport <ArrowRight size={17} /></Link></aside>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-[#004A25]/10 pb-3"><dt className="text-[#3E594B]">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>; }
