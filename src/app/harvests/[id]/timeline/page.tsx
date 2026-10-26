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
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">KV-2026-001 · Tomatoes</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">Harvest traceability</h1>
          <StatusBadge status="sold" />
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#74767B]">
          Each event records what happened, when it happened and which quantity is being tracked.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-7 shadow-xs">
            <div className="relative">
              {events.map((event, index) => (
                <div key={event.title} className="grid grid-cols-[32px_1fr] gap-4 pb-8 last:pb-0">
                  <div className="relative flex justify-center">
                    {index < events.length - 1 && (
                      <span className={`absolute top-7 bottom-[-28px] w-0.5 ${event.done ? 'bg-[#00C896]' : 'bg-[#E2DED6]'}`} />
                    )}
                    <span className={`relative z-10 grid size-7 place-items-center rounded-full border shadow-2xs ${
                      event.done
                        ? 'border-[#00C896] bg-[#00C896] text-white'
                        : 'border-[#E2DED6] bg-white'
                    }`}>
                      {event.done && <Check size={14} strokeWidth={3} />}
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-mono font-semibold text-[#74767B]">{event.time}</p>
                    <h2 className="mt-1 font-bold text-[#17191D]">{event.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#74767B]">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-[#22252A] bg-[#17191D] p-5 text-white shadow-md">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Quantity record</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-400">Declared</dt>
                <dd className="font-bold text-white font-mono">220 kg</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-4">
                <dt className="text-neutral-400">Agreed</dt>
                <dd className="font-bold text-white font-mono">220 kg</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-4">
                <dt className="text-neutral-400">Received</dt>
                <dd className="text-neutral-300">Pending handover</dd>
              </div>
            </dl>
            <Link href="/offers" className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-sm font-bold text-white hover:text-[#FF5A1F] transition-colors">
              <span>Offer details</span> <ArrowRight size={17} />
            </Link>
          </aside>
        </div>
        <div className="mt-8"><DemoNotice>All events are seeded demonstration records.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
