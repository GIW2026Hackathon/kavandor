import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

export default function StorageRequestsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Cold Chain Network" title="Storage reservations" description="Manage active and reserved cold room capacity slots across Kisii & Nyamira." />
        <section className="mt-7 rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                Capacity Confirmed
              </span>
              <h2 className="mt-4 text-xl font-bold text-[#17191D]">Tomatoes · 220 kg</h2>
              <p className="mt-1 font-mono text-xs text-[#74767B]">RES-2026-001 · Kisii Central Cold Store Hub</p>
              <p className="mt-3 text-sm leading-6 text-[#74767B]">Arrival 27 Oct 2026 · Estimated storage KSh 4,928 (7 days)</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-wider text-[#74767B]">Transport</p>
              <p className="mt-1 font-bold text-[#17191D]">KAVANDOR Express · Dispatched</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#E2DED6] pt-5 sm:flex-row">
            <Link
              href="/storage/requests/RES-2026-001"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#E44E18]"
            >
              View reservation <ArrowRight size={16} />
            </Link>
            <Link
              href="/transport/requests/TJ-2026-001"
              className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] px-5 text-sm font-bold text-[#17191D] transition hover:border-[#17191D] hover:bg-[#F6F3EC]"
            >
              Track transport
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
