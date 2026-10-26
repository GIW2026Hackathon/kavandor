import Link from 'next/link';
import { ArrowRight, Check, Clock3, MapPin, Package, Route, Truck } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

const shipmentStages = [
  { label: 'Requested', detail: '12:20', complete: true },
  { label: 'Quote', detail: 'Pending', complete: false },
  { label: 'Pickup', detail: 'Not assigned', complete: false },
  { label: 'Delivered', detail: 'Not started', complete: false },
];

export default function TransportOverviewPage() {
  return (
    <AppShell role="transport_provider">
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Collections and delivery" title="Transport manager" description="Coordinate demo pickup, provider response and handover in one operational view." />

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <Metric icon={Package} label="Active shipments" value="1" detail="Awaiting provider action" />
          <Metric icon={Clock3} label="Needs attention" value="Quote" detail="Provider response pending" />
          <Metric icon={Truck} label="Delivered today" value="0" detail="No confirmed delivery" />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#E2DED6] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b border-[#E2DED6] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="flex gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#17191D] text-[#FF5A1F]">
                <Truck size= {22} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-mono font-bold uppercase text-[#74767B]">SONGA-DEMO-001</p>
                  <span className="rounded-full border border-[#FFD9CC] bg-[#FFF0EB] px-2.5 py-1 text-[11px] font-bold text-[#FF5A1F]">Quote pending</span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-[#17191D]">Tomatoes · 220 kg</h2>
                <p className="mt-1 text-sm text-[#74767B]">Pickup 27 Oct 2026 · 11 crates · cold chain handling</p>
              </div>
            </div>
            <Link href="/transport/requests/SONGA-DEMO-001" className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#E44E18]">
              Open transport <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1.35fr_.65fr]">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#74767B]">Shipment progress</p>
                <span className="text-xs font-semibold text-[#74767B]">1 of 4 stages</span>
              </div>
              <div className="mt-6 grid grid-cols-4">
                {shipmentStages.map((stage, index) => (
                  <div key={stage.label} className="relative text-center">
                    {index < shipmentStages.length - 1 && <span className={`absolute left-1/2 top-4 h-px w-full ${stage.complete ? 'bg-[#00C896]' : 'bg-[#E2DED6]'}`} />}
                    <span className={`relative z-10 mx-auto grid size-8 place-items-center rounded-full border ${stage.complete ? 'border-[#00C896] bg-[#00C896] text-white' : 'border-[#E2DED6] bg-white text-[#74767B]'}`}>
                      {stage.complete ? <Check size={16} /> : index + 1}
                    </span>
                    <p className="mt-3 text-xs font-bold text-[#17191D]">{stage.label}</p>
                    <p className="mt-1 text-[11px] text-[#74767B]">{stage.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E2DED6] p-5 lg:border-l lg:border-t-0 sm:p-6">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#74767B]">Route</p>
              <div className="mt-5 grid grid-cols-[24px_1fr] gap-x-3">
                <span className="grid size-6 place-items-center rounded-full border-2 border-[#FF5A1F] bg-white"><span className="size-2 rounded-full bg-[#FF5A1F]" /></span>
                <div>
                  <p className="text-xs text-[#74767B]">Pickup</p>
                  <p className="mt-1 text-sm font-bold text-[#17191D]">Nyakundi farm</p>
                  <p className="text-xs text-[#74767B]">Kisii, Kenya</p>
                </div>
                <span className="mx-auto h-10 w-px bg-[#E2DED6]" />
                <div />
                <span className="grid size-6 place-items-center rounded-full bg-[#17191D] text-white"><MapPin size={13} /></span>
                <div>
                  <p className="text-xs text-[#74767B]">Destination</p>
                  <p className="mt-1 text-sm font-bold text-[#17191D]">Kisii Cold Store</p>
                  <p className="text-xs text-[#74767B]">Kisii Town</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-[#FFF0EB] text-[#FF5A1F]"><Route size={18} /></span>
              <h2 className="font-bold text-[#17191D]">Collection requirements</h2>
            </div>
            <dl className="mt-5 divide-y divide-[#E2DED6] border-y border-[#E2DED6]">
              <Detail label="Contact" value="James Nyakundi" />
              <Detail label="Load" value="11 ventilated crates" />
              <Detail label="Handling" value="Keep cool and dry" />
              <Detail label="Storage request" value="STORAGE-DEMO-001" />
            </dl>
            <Link href="/storage/requests/storage-request-001" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#FF5A1F]">View linked storage <ArrowRight size={16} /></Link>
          </section>

          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#74767B]">Provider quote</p>
            <h2 className="mt-2 text-2xl font-bold text-[#17191D]">Awaiting response</h2>
            <p className="mt-2 text-sm leading-6 text-[#74767B]">No quote, vehicle, driver or estimated arrival time has been confirmed.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-4"><p className="text-xs text-[#74767B]">Estimated cost</p><p className="mt-1 font-mono font-bold text-[#17191D]">KSh 650</p></div>
              <div className="rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-4"><p className="text-xs text-[#74767B]">Vehicle</p><p className="mt-1 font-bold text-[#17191D]">Unassigned</p></div>
            </div>
          </section>
        </div>

        <div className="mt-6"><DemoNotice>No vehicle, quote or dispatch has been confirmed. No authorised Songa Mobility integration is connected.</DemoNotice></div>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Truck; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-[#74767B]">{label}</p><Icon size={18} className="text-[#FF5A1F]" /></div>
      <p className="mt-3 text-3xl font-bold text-[#17191D]">{value}</p>
      <p className="mt-1 text-xs text-[#74767B]">{detail}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[110px_1fr] gap-3 py-3 text-sm"><dt className="text-[#74767B]">{label}</dt><dd className="text-right font-semibold text-[#17191D]">{value}</dd></div>;
}
