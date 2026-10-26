import Link from 'next/link';
import { Check, MapPin, Package, Phone, Truck } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';

export const instant = false;

const events = [
  { title: 'Demo transport request submitted', detail: 'Nyakundi farm to Kisii Cold Store Demo', time: '26 Oct · 12:20', source: 'KAVANDOR demo', done: true },
  { title: 'Quote requested', detail: 'Songa provider adapter is not connected', time: '26 Oct · 12:21', source: 'Demo integration', done: true },
  { title: 'Awaiting quote', detail: 'No price, vehicle or estimated arrival has been confirmed', time: 'Pending', source: 'No external request sent', done: false },
  { title: 'Vehicle assignment', detail: 'Unavailable until a provider quote is confirmed', time: 'Pending', source: 'Not available', done: false },
  { title: 'Pickup and delivery', detail: 'No live location or dispatch has been recorded', time: 'Pending', source: 'Not available', done: false },
];

export default async function TransportTrackingPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  return (
    <AppShell role="transport_provider">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
        <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">Demo — not connected to Songa Mobility dispatch</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#17191D] sm:text-4xl">Transport tracking</h1>
            <p className="mt-2 text-sm text-[#74767B]">Reference {requestId}</p>
          </div>
          <span className="w-fit rounded-full border border-[#FFD9CC] bg-[#FFF0EB] px-3 py-1 text-xs font-bold text-[#FF5A1F]">Quote pending</span>
        </div>

        <section className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-[#E2DED6] bg-[#E2DED6] sm:grid-cols-3">
          <ShipmentSummary icon={Package} label="Cargo" value="Tomatoes · 220 kg" />
          <ShipmentSummary icon={Truck} label="Equipment" value="11 ventilated crates" />
          <ShipmentSummary icon={MapPin} label="Planned arrival" value="27 Oct · 09:00" />
        </section>

        <section className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-[#22252A] bg-[#22252A] sm:grid-cols-[1fr_46px_1fr]">
          <RouteStop label="Pickup" name="Nyakundi farm" detail="Kisii, Kenya · James Nyakundi" />
          <div className="relative hidden items-center sm:flex"><span className="absolute h-px w-full bg-[#FF5A1F]" /><Truck size={18} className="relative z-10 mx-auto rounded-full bg-[#22252A] text-[#FF5A1F]" /></div>
          <RouteStop label="Destination" name="Kisii Cold Store Demo" detail="Kisii Town · receiving team" />
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
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
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Songa Mobility · demo</p>
            <h2 className="mt-3 text-xl font-bold">Provider response</h2>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Estimated quote</p>
              <p className="mt-1 font-mono text-2xl font-bold">KSh 650</p>
              <p className="mt-2 text-xs text-white/60">Illustrative · not yet confirmed</p>
            </div>
            <dl className="mt-5 space-y-4 border-t border-white/10 pt-5 text-sm">
              <Summary label="Vehicle" value="Unassigned" />
              <Summary label="Driver" value="Not available" />
              <Summary label="Contact" value="James Nyakundi" />
              <Summary label="Quote status" value="Awaiting provider" />
            </dl>
            <button type="button" disabled className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-bold text-white/50" title="Available when provider integration is connected">
              <Phone size={16} /> Provider quote unavailable
            </button>
            <Link href="/storage/requests" className="mt-5 block text-center text-sm font-bold text-[#FF5A1F] underline underline-offset-4 hover:text-[#FF7A45]">
              View linked storage request
            </Link>
          </aside>
        </div>
        <div className="mt-6"><DemoNotice>Fictional Songa-branded demo workflow. No authorised integration or dispatch has been used.</DemoNotice></div>
      </div>
    </AppShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-white/50">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }

function ShipmentSummary({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="bg-white p-5">
      <Icon size={18} className="text-[#FF5A1F]" />
      <p className="mt-3 text-xs text-[#74767B]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#17191D]">{value}</p>
    </div>
  );
}

function RouteStop({ label, name, detail }: { label: string; name: string; detail: string }) {
  return (
    <div className="bg-[#17191D] p-5 text-white">
      <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">{label}</p>
      <p className="mt-2 text-base font-bold">{name}</p>
      <p className="mt-1 text-xs leading-5 text-white/60">{detail}</p>
    </div>
  );
}
