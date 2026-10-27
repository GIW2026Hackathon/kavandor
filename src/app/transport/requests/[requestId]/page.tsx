import Link from 'next/link';
import { connection } from 'next/server';
import { Check } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';

export const instant = false;

const events = [
  { title: 'Logistics Request Dispatched', detail: 'Nyakundi farm, Kisii to Kisii Central Cold Store Hub', time: 'Today · 08:30 EAT', source: 'KAVANDOR Dispatch Engine', done: true },
  { title: 'Vehicle Class Assigned', detail: 'Probox / Pickup verified for horticultural cargo (Capacity up to 1,000 kg)', time: 'Today · 08:45 EAT', source: 'Regional Transporter Fleet', done: true },
  { title: 'Driver Assigned & En Route', detail: 'Driver Peter Mochache en route for farmgate collection', time: 'Today · 09:15 EAT', source: 'KAVANDOR Driver App', done: true },
  { title: 'Farmgate Weighing & Loading', detail: 'Digital hanging scale verification prior to transit departure', time: 'In Progress', source: 'Field Transporter Verification', done: false },
  { title: 'Cold Hub Intake & Gate Scan', detail: 'Cold store tare weight reconciliation and climate room intake', time: 'Scheduled', source: 'Kisii Central Cold Store Hub', done: false },
];

export default async function TransportTrackingPage({ params }: { params: Promise<{ requestId: string }> }) {
  await connection();
  const { requestId } = await params;
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
        <p className="text-xs font-mono font-bold uppercase text-emerald-600">Active Transit Dispatch · Verified Provider Network</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17191D] sm:text-4xl">Transport tracking</h1>
        <p className="mt-2 text-sm text-[#74767B]">Job Reference #{requestId}</p>
        <div className="mt-7 grid gap-6 md:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm sm:p-7">
            {events.map((event, index) => (
              <div key={event.title} className="grid grid-cols-[32px_1fr] gap-4 pb-8 last:pb-0">
                <div className="relative flex justify-center">
                  {index < events.length - 1 && (
                    <span className={`absolute bottom-[-28px] top-7 w-px ${event.done ? 'bg-[#00C896]' : 'bg-[#E2DED6]'}`} />
                  )}
                  <span
                    className={`relative z-10 grid size-7 place-items-center rounded-full border text-xs font-bold ${
                      event.done
                        ? 'border-[#00C896] bg-[#00C896] text-white shadow-sm'
                        : 'border-[#E2DED6] bg-white text-[#74767B]'
                    }`}
                  >
                    {event.done && <Check size={14} className="stroke-[3]" />}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#74767B]">{event.time}</p>
                  <h2 className="mt-1 font-bold text-[#17191D]">{event.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[#74767B]">{event.detail}</p>
                  <p className="mt-1 text-xs text-[#9E9E9E]">Source: {event.source}</p>
                </div>
              </div>
            ))}
          </section>
          <aside className="h-fit rounded-2xl border border-[#22252A] bg-[#17191D] p-6 text-white shadow-md">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">KAVANDOR Express Dispatch</p>
            <h2 className="mt-3 text-xl font-bold">Dispatched · En Route</h2>
            <dl className="mt-5 space-y-4 border-t border-white/10 pt-5 text-sm">
              <Summary label="Cargo" value="220 kg Tomatoes" />
              <Summary label="Pickup" value="Nyakundi farm, Kisii" />
              <Summary label="Destination" value="Kisii Central Cold Store Hub" />
              <Summary label="Agreed Rate" value="KES 650 · Settled via Escrow" />
            </dl>
            <Link href="/storage/requests" className="mt-5 block text-sm font-bold text-[#FF5A1F] hover:text-[#FF7A45] underline underline-offset-4">
              Back to storage requests
            </Link>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-white/50">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
