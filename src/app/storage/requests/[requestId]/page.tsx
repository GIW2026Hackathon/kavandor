import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';

export const instant = false;

export default async function StorageRequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
        <p className="text-xs font-mono font-bold uppercase text-emerald-600">Active Reservation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17191D] sm:text-4xl">Storage reservation</h1>
        <p className="mt-2 text-sm text-[#74767B]">Reservation Reference #{requestId}</p>
        <div className="mt-7 grid gap-6 md:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#17191D]">Tomatoes · 220 kg</h2>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                Confirmed &amp; Allocated
              </span>
            </div>
            <div className="mt-6 space-y-4 text-sm">
              <Row label="Facility" value="Kisii Central Cold Store Hub" />
              <Row label="Arrival Window" value="27 Oct 2026, 08:00 - 12:00" />
              <Row label="Duration" value="7 Days buffer" />
              <Row label="Storage Tariff" value="KSh 4,928 (KES 3.20/kg/day)" />
              <Row label="Transport" value="KAVANDOR Express Dispatch · Scheduled" />
            </div>
            <p className="mt-6 rounded-xl border border-[#E2DED6] border-l-4 border-l-emerald-500 bg-[#F6F3EC] p-4 text-sm leading-6 text-[#74767B]">
              Capacity is reserved under atomic allocation ledger rules. Digital intake weight scale validation will occur upon gate arrival.
            </p>
          </section>
          <aside className="h-fit rounded-2xl border border-[#22252A] bg-[#17191D] p-6 text-white shadow-md">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Intake Status</p>
            <h2 className="mt-3 text-xl font-bold">Awaiting Gate Arrival</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Chamber temperature currently pre-cooled to 11.8°C with 82% relative humidity.
            </p>
            <Link
              href="/transport/requests/TJ-2026-001"
              className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-bold text-[#FF5A1F] hover:text-[#FF7A45]"
            >
              Track transit job <ArrowRight size={17} />
            </Link>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-[#E2DED6] pb-3 last:border-b-0 last:pb-0">
      <dt className="text-[#74767B]">{label}</dt>
      <dd className="text-right font-semibold text-[#17191D]">{value}</dd>
    </div>
  );
}
