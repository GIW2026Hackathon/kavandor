import Link from 'next/link';
import { ArrowRight, ChevronRight, CircleAlert, ClipboardCheck, PackagePlus, Sprout, TrendingUp } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { HarvestCard } from '@/components/dashboard/harvest-card';
import { PageHeader } from '@/components/ui/page-header';

const activity = [
  { label: 'Harvest intake submitted', detail: 'Tomatoes · 220 kg', time: 'Today, 10:40' },
  { label: 'Location confirmed', detail: 'Nyakundi farm, Kisii', time: 'Today, 10:42' },
  { label: 'AI Quality Appraisal ready', detail: 'Grade A verified (89% market readiness) · Kisii Field Unit', time: 'Today, 11:05' },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <PageHeader
          eyebrow="Tuesday, 26 October"
          title="Good morning, James"
          description="Your tomato harvest is ready for an informed next move."
          action={
            <Link
              href="/harvests/new"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98"
            >
              <PackagePlus size={18} /> Register new harvest
            </Link>
          }
        />

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Active harvests', value: '2', detail: '1 ready for action', icon: Sprout },
            { label: 'Pending offers', value: '1', detail: 'Expires in 18 hours', icon: TrendingUp },
            { label: 'Completed', value: '3', detail: 'All quantity records complete', icon: ClipboardCheck },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-[#E2DED6] border-l-4 border-l-[#FF5A1F] bg-white px-5 py-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#74767B]">{metric.label}</p>
                <metric.icon size={18} className="text-[#FF5A1F]" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-[#17191D] font-mono">{metric.value}</p>
              <p className="mt-1 text-xs text-[#74767B]">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.7fr)]">
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F] tracking-wider">My harvests</p>
                <h2 className="mt-1 text-xl font-bold text-[#17191D]">Produce in progress</h2>
              </div>
              <Link href="/harvests" className="text-sm font-bold text-[#FF5A1F] hover:underline">View all</Link>
            </div>
            <HarvestCard crop="Tomatoes" quantity={220} unit="kg" harvestDate="26 Oct 2026" location="Nyakundi farm · Kisii" status="assessed" action="Review harvest" href="/harvests/KV-2026-001" />
            <HarvestCard crop="Bananas" quantity={8} unit="crate" harvestDate="24 Oct 2026" location="Nyakundi farm · Kisii" status="offer_pending" action="Review offer" href="/offers" />
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-[#17191D] p-5 text-white sm:p-6 border border-[#22252A] shadow-md">
              <div className="flex items-center gap-2 text-[#FF5A1F]">
                <CircleAlert size={18} />
                <p className="text-xs font-mono font-bold uppercase tracking-wider">Needs attention</p>
              </div>
              <h2 className="mt-3 text-xl font-bold text-white">Review two next moves</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-300">Compare what your tomato harvest could earn before accepting a buyer offer.</p>
              <Link href="/harvests/KV-2026-001/compare" className="mt-5 flex h-11 items-center justify-between rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-4 text-sm font-bold text-white transition shadow-sm">
                <span>Compare options</span> <ChevronRight size={18} />
              </Link>
            </section>

            <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-lg font-bold text-[#17191D]">Your next moves</h2>
              <div className="mt-4 divide-y divide-[#E2DED6]">
                {[
                  ['Check tomato assessment', '/harvests/KV-2026-001'],
                  ['Review offer from FreshLink', '/offers'],
                  ['Plan collection', '/offers'],
                ].map(([label, href]) => (
                  <Link key={label} href={href} className="flex items-center justify-between py-3 text-sm font-semibold text-[#17191D] hover:text-[#FF5A1F] transition-colors">
                    <span>{label}</span>
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-8 border-t border-[#E2DED6] pt-6">
          <h2 className="text-xl font-bold text-[#17191D]">Recent activity</h2>
          <div className="mt-4 grid gap-px bg-[#E2DED6] md:grid-cols-3 rounded-xl overflow-hidden border border-[#E2DED6]">
            {activity.map((item) => (
              <div key={item.label} className="bg-white px-4 py-4 md:px-5">
                <p className="text-xs font-mono font-semibold text-[#74767B]">{item.time}</p>
                <p className="mt-2 text-sm font-bold text-[#17191D]">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#74767B]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
