import Link from 'next/link';
import { ArrowRight, Droplets, Gauge, Info, ShieldAlert, Thermometer } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { demoFacilities } from '@/demo/storage';

export const instant = false;

export default async function FacilityDetailPage({ params }: { params: Promise<{ facilityId: string }> }) {
  const { facilityId } = await params;
  const facility = demoFacilities.find((item) => item.id === facilityId);
  if (!facility) return <AppShell><div className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-3xl font-bold">Facility unavailable</h1><p className="mt-3 text-[#3E594B]">This demo facility could not be found.</p></div></AppShell>;

  const humidityWarning = facility.humidityPercent > 80;
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-xs font-bold uppercase text-[#76AC3C]">Demo facility · Unverified</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{facility.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#3E594B]">{facility.description}</p>
            <div className="mt-6 min-h-64 bg-[linear-gradient(135deg,#76AC3C,#004A25)] p-5 flex items-end"><span className="bg-[#004A25]/90 px-3 py-2 text-xs font-bold text-white">Facility media placeholder · replace with authorised imagery</span></div>
          </div>
          <aside className="h-fit border border-[#004A25]/10 bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#3E594B]">Available capacity</p><p className="mt-2 text-3xl font-bold">{facility.availableCapacityKg.toLocaleString()} <span className="text-sm">kg</span></p>
            <p className="mt-5 border-t border-[#004A25]/10 pt-4 text-sm"><span className="text-[#3E594B]">Demo price:</span> <strong>KSh {facility.pricePerUnit} / kg / day</strong></p>
            <Link href={`/storage/${facility.id}/request`} className="mt-5 flex h-12 items-center justify-between rounded-lg bg-[#F2C303] px-4 text-sm font-bold text-[#004A25]">Request storage <ArrowRight size={17} /></Link>
            <Link href={`/storage/${facility.id}/conditions`} className="mt-3 flex h-11 items-center justify-center border border-[#004A25]/15 text-sm font-bold">View condition history</Link>
          </aside>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.75fr]">
          <div className="border border-[#004A25]/10 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase text-[#3E594B]">Last reported inspection</p><h2 className="mt-2 text-2xl font-bold">Current storage conditions</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${humidityWarning ? 'bg-[#FFF4C5] text-[#004A25]' : 'bg-[#EDF5DF] text-[#004A25]'}`}>{humidityWarning ? 'Warning — review' : 'Within demo range'}</span></div>
            <p className="mt-2 text-xs text-[#3E594B]">Observed 26 Oct 2026 at 09:20 · Operator-maintained demo record</p>
            <div className="mt-6 grid gap-px bg-[#004A25]/10 sm:grid-cols-2">
              <Condition icon={Thermometer} label="Temperature" value={`${facility.temperatureC}°C`} />
              <Condition icon={Droplets} label="Relative humidity" value={`${facility.humidityPercent}%`} />
              <Condition icon={Gauge} label="Cooling status" value="Reported normal" />
              <Condition icon={ShieldAlert} label="Power and pests" value="No active incident" />
            </div>
            {humidityWarning && <div className="mt-5 border-l-2 border-[#F2C303] bg-[#FFF4C5] p-4 text-sm"><strong>Demo warning:</strong> Relative humidity exceeds the facility&apos;s configured demonstration target of 80%. An operator should investigate; this does not prove spoilage.</div>}
          </div>

          <aside className="space-y-5">
            <div className="border border-[#004A25]/10 bg-white p-5"><h2 className="font-bold">Facility overview</h2><dl className="mt-4 space-y-3 text-sm"><Row label="Type" value={facility.facilityType.replace('_', ' ')} /><Row label="Location" value={`${facility.locality}, ${facility.county}`} /><Row label="Accepted" value={facility.acceptedCommodities.join(', ')} /><Row label="Methods" value={facility.storageTypes.join(', ')} /></dl></div>
            <div className="border border-[#004A25]/10 bg-white p-5"><div className="flex items-center gap-2"><Info size={17} /><h2 className="font-bold">Pricing policy</h2></div><p className="mt-3 text-sm leading-6 text-[#3E594B]">KSh {facility.pricePerUnit} per kg per day. Handling and transport are not included. Capacity and costs are demonstration values.</p></div>
          </aside>
        </section>
        <div className="mt-6"><DemoNotice>Demo facility, inspection and capacity. Replace with authorised facility data before live use.</DemoNotice></div>
      </div>
    </AppShell>
  );
}

function Condition({ icon: Icon, label, value }: { icon: typeof Thermometer; label: string; value: string }) {
  return <div className="bg-white p-4"><Icon size={18} className="text-[#76AC3C]" /><p className="mt-3 text-xs text-[#3E594B]">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[90px_1fr] gap-3"><dt className="text-[#3E594B]">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}
