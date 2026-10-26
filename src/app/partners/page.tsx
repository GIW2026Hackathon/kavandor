import Link from 'next/link';
import { ArrowRight, BellRing, Boxes, PackageOpen, Thermometer } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

const requestRows = [
  { code: 'STORAGE-DEMO-001', crop: 'Tomatoes · 220 kg', farmer: 'James Nyakundi', arrival: '27 Oct · 08:00', status: 'Review required' },
  { code: 'STORAGE-DEMO-002', crop: 'Avocados · 80 kg', farmer: 'Wanjiku M.' , arrival: '28 Oct · 10:30', status: 'Capacity check' },
];

export default function PartnersPage() {
  return (
    <AppShell role="facility_operator">
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Facility operations" title="Kisii Cold Store" description="Review incoming produce, manage occupied capacity and monitor storage conditions." />

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FacilityMetric icon={PackageOpen} label="Incoming requests" value="2" detail="1 requires a decision" />
          <FacilityMetric icon={Boxes} label="Available capacity" value="840 kg" detail="68% capacity available" />
          <FacilityMetric icon={Thermometer} label="Room condition" value="11.8°C" detail="82% RH · review" warning />
          <FacilityMetric icon={BellRing} label="Open alerts" value="1" detail="Humidity above target" warning />
        </section>

        <section className="mt-6 rounded-2xl border border-[#E2DED6] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#E2DED6] p-5 sm:p-6">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Request queue</p>
              <h2 className="mt-1 text-xl font-bold text-[#17191D]">Awaiting facility response</h2>
            </div>
            <Link href="/storage/requests" className="hidden h-10 items-center gap-2 rounded-xl border border-[#E2DED6] px-4 text-sm font-bold text-[#17191D] sm:flex">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-[#E2DED6]">
            {requestRows.map((request) => (
              <div key={request.code} className="grid gap-4 p-5 sm:grid-cols-[1fr_130px_150px] sm:items-center sm:p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><p className="font-mono text-xs font-bold text-[#74767B]">{request.code}</p><span className="rounded-full border border-[#FFD9CC] bg-[#FFF0EB] px-2.5 py-1 text-[10px] font-bold text-[#FF5A1F]">{request.status}</span></div>
                  <h3 className="mt-2 font-bold text-[#17191D]">{request.crop}</h3>
                  <p className="mt-1 text-sm text-[#74767B]">{request.farmer}</p>
                </div>
                <div><p className="text-xs text-[#74767B]">Expected arrival</p><p className="mt-1 font-mono text-sm font-bold text-[#17191D]">{request.arrival}</p></div>
                <Link href="/storage/requests/storage-request-001" className="flex h-11 items-center justify-center rounded-xl bg-[#17191D] px-4 text-sm font-bold text-white">Review request</Link>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Link href="/storage/facility-01/conditions" className="group rounded-2xl border border-[#E2DED6] bg-white p-6 transition hover:border-[#FF5A1F]">
            <Thermometer size={20} className="text-[#FF5A1F]" /><h2 className="mt-4 font-bold text-[#17191D]">Condition monitoring</h2><p className="mt-2 text-sm leading-6 text-[#74767B]">Inspect recent temperature, humidity and handling observations.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#FF5A1F]">Open conditions <ArrowRight size={16} /></span>
          </Link>
          <Link href="/storage/inventory" className="group rounded-2xl border border-[#E2DED6] bg-white p-6 transition hover:border-[#FF5A1F]">
            <Boxes size={20} className="text-[#FF5A1F]" /><h2 className="mt-4 font-bold text-[#17191D]">Facility inventory</h2><p className="mt-2 text-sm leading-6 text-[#74767B]">Reconcile declared arrivals with admitted produce and handover records.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#FF5A1F]">Manage inventory <ArrowRight size={16} /></span>
          </Link>
        </div>
        <div className="mt-6"><DemoNotice>Facility operations are demonstration records. No live reservation or condition data is connected.</DemoNotice></div>
      </div>
    </AppShell>
  );
}

function FacilityMetric({ icon: Icon, label, value, detail, warning = false }: { icon: typeof PackageOpen; label: string; value: string; detail: string; warning?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-[#74767B]">{label}</p><Icon size={18} className={warning ? 'text-[#FF5A1F]' : 'text-[#00C896]'} /></div>
      <p className="mt-3 text-2xl font-bold text-[#17191D]">{value}</p><p className={`mt-1 text-xs ${warning ? 'text-[#FF5A1F]' : 'text-[#74767B]'}`}>{detail}</p>
    </div>
  );
}
