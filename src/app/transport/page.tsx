import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

export const instant = false;

export default function TransportOverviewPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Logistics & Dispatch" title="Transport & Collections" description="Monitor certified agricultural haulage, farmgate pickups, and cold chain transfer dispatches." />
        <section className="mt-7 rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-[#17191D] text-[#FF5A1F] shadow-sm">
              <Truck size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono font-bold uppercase text-emerald-600">Active Dispatch · Kisii Corridor</p>
              <h2 className="mt-1 text-xl font-bold text-[#17191D]">Tomatoes · 220 kg</h2>
              <p className="mt-1 text-sm text-[#74767B]">Nyakundi farm to Kisii Central Cold Store Hub</p>
            </div>
            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              En Route
            </span>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#E2DED6] pt-5 sm:flex-row">
            <Link href="/transport/requests/TJ-2026-001" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98">
              Track transport dispatch <ArrowRight size={16} />
            </Link>
            <Link href="/storage/requests" className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs">
              View storage reservation
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
