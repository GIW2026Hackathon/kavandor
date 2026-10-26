import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { StatusBadge } from '@/components/ui/status-badge';

const events = [
  { title: 'Harvest registered', detail: 'James Nyakundi declared 220 kg tomatoes', time: '26 Oct · 10:40', done: true },
  { title: 'Assessment completed', detail: 'Demo visible-condition assessment recorded', time: '26 Oct · 11:05', done: true },
  { title: 'Listing published', detail: '220 kg available for demo buyer offers', time: '26 Oct · 11:12', done: true },
  { title: 'Buyer offer accepted', detail: 'FreshLink Kisii · KSh 18.18/kg', time: '26 Oct · 12:18', done: true },
  { title: 'Collection scheduled', detail: 'Nyakundi farm · awaits transport confirmation', time: 'Next step', done: false },
  { title: 'Produce handed over', detail: 'Capture handover quantity and actor', time: 'Pending', done: false },
  { title: 'Transaction completed', detail: 'Record received quantity and final outcome', time: 'Pending', done: false },
];

export default function TimelinePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
        <p className="text-xs font-bold uppercase text-[#3E594B]">KV-2026-001 · Tomatoes</p>
        <div className="mt-2 flex items-end justify-between gap-4"><h1 className="text-3xl font-bold sm:text-4xl">Harvest traceability</h1><StatusBadge status="sold" /></div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#3E594B]">Each event records what happened, when it happened and which quantity is being tracked.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
          <section className="border border-[#004A25]/10 bg-white p-5 sm:p-7">
            <div className="relative">
              {events.map((event, index) => (
                <div key={event.title} className="grid grid-cols-[32px_1fr] gap-4 pb-8 last:pb-0">
                  <div className="relative flex justify-center">
                    {index < events.length - 1 && <span className={`absolute top-7 bottom-[-28px] w-px ${event.done ? 'bg-[#76AC3C]' : 'bg-[#004A25]/10'}`} />}
                    <span className={`relative z-10 grid size-7 place-items-center rounded-full border ${event.done ? 'border-[#76AC3C] bg-[#F2C303]' : 'border-[#004A25]/15 bg-white'}`}>{event.done && <Check size={14} />}</span>
                  </div>
                  <div className="pt-1"><p className="text-xs font-semibold text-[#3E594B]">{event.time}</p><h2 className="mt-1 font-bold">{event.title}</h2><p className="mt-1 text-sm leading-6 text-[#3E594B]">{event.detail}</p></div>
                </div>
              ))}
            </div>
          </section>

          <aside className="h-fit bg-[#004A25] p-5 text-[#FFFFFF]">
            <p className="text-xs font-bold uppercase text-[#F2C303]">Quantity record</p>
            <dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between"><dt className="text-white/55">Declared</dt><dd className="font-bold">220 kg</dd></div><div className="flex justify-between border-t border-white/10 pt-4"><dt className="text-white/55">Agreed</dt><dd className="font-bold">220 kg</dd></div><div className="flex justify-between border-t border-white/10 pt-4"><dt className="text-white/55">Received</dt><dd>Pending handover</dd></div></dl>
            <Link href="/offers" className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-sm font-bold">Offer details <ArrowRight size={17} /></Link>
          </aside>
        </div>
        <div className="mt-6"><DemoNotice>All events are seeded demonstration records.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
