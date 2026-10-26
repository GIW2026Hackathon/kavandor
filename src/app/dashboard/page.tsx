import Link from 'next/link';
import { ArrowRight, ChevronRight, CircleAlert, ClipboardCheck, PackagePlus, Sprout, TrendingUp } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { HarvestCard } from '@/components/dashboard/harvest-card';
import { PageHeader } from '@/components/ui/page-header';

const activity = [
  { label: 'Harvest intake submitted', detail: 'Tomatoes · 220 kg', time: 'Today, 10:40' },
  { label: 'Location confirmed', detail: 'Nyakundi farm, Kisii', time: 'Today, 10:42' },
  { label: 'Visual assessment ready', detail: 'Demo assessment · verify field observations', time: 'Today, 11:05' },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <PageHeader
          eyebrow="Tuesday, 26 October"
          title="Good morning, James"
          description="Your tomato harvest is ready for an informed next move."
          action={<Link href="/harvests/new" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#F2C303] px-4 text-sm font-bold text-[#004A25]"><PackagePlus size={18} /> Register new harvest</Link>}
        />

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Active harvests', value: '2', detail: '1 ready for action', icon: Sprout },
            { label: 'Pending offers', value: '1', detail: 'Expires in 18 hours', icon: TrendingUp },
            { label: 'Completed', value: '3', detail: 'All quantity records complete', icon: ClipboardCheck },
          ].map((metric) => (
            <div key={metric.label} className="border-l-2 border-[#004A25] bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#3E594B]">{metric.label}</p>
                <metric.icon size={18} className="text-[#3E594B]" />
              </div>
              <p className="mt-3 text-3xl font-bold text-[#004A25]">{metric.value}</p>
              <p className="mt-1 text-xs text-[#3E594B]">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.7fr)]">
          <section className="border border-[#004A25]/10 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-[#3E594B]">My harvests</p>
                <h2 className="mt-1 text-xl font-bold">Produce in progress</h2>
              </div>
              <Link href="/harvests" className="text-sm font-bold">View all</Link>
            </div>
            <HarvestCard crop="Tomatoes" quantity={220} unit="kg" harvestDate="26 Oct 2026" location="Nyakundi farm · Kisii" status="assessed" action="Review harvest" href="/harvests/demo-harvest-001" />
            <HarvestCard crop="Bananas" quantity={8} unit="crate" harvestDate="24 Oct 2026" location="Nyakundi farm · Kisii" status="offer_pending" action="Review offer" href="/offers" />
          </section>

          <aside className="space-y-6">
            <section className="bg-[#004A25] p-5 text-[#FFFFFF] sm:p-6">
              <div className="flex items-center gap-2 text-[#F2C303]"><CircleAlert size={18} /><p className="text-xs font-bold uppercase">Needs attention</p></div>
              <h2 className="mt-3 text-xl font-bold">Review two next moves</h2>
              <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/65">Compare what your tomato harvest could earn before accepting a buyer offer.</p>
              <Link href="/harvests/demo-harvest-001/compare" className="mt-5 flex h-11 items-center justify-between bg-[#F2C303] px-4 text-sm font-bold text-[#004A25]">Compare options <ChevronRight size={18} /></Link>
            </section>

            <section className="border border-[#004A25]/10 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold">Your next moves</h2>
              <div className="mt-4 divide-y divide-[#004A25]/10">
                {[
                  ['Check tomato assessment', '/harvests/demo-harvest-001'],
                  ['Review offer from FreshLink', '/offers'],
                  ['Plan collection', '/offers'],
                ].map(([label, href]) => <Link key={label} href={href} className="flex items-center justify-between py-3 text-sm font-semibold"><span>{label}</span><ArrowRight size={16} /></Link>) }
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-8 border-t border-[#004A25]/10 pt-6">
          <h2 className="text-xl font-bold">Recent activity</h2>
          <div className="mt-4 grid gap-px bg-[#004A25]/10 md:grid-cols-3">
            {activity.map((item) => (
              <div key={item.label} className="bg-[#FFFFFF] px-4 py-4 md:px-5">
                <p className="text-xs font-semibold text-[#3E594B]">{item.time}</p>
                <p className="mt-2 text-sm font-bold">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#3E594B]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-8"><DemoNotice /></div>
      </div>
    </AppShell>
  );
}
