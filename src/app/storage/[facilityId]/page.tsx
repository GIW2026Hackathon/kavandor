import Link from 'next/link';
import { ArrowRight, Droplets, Gauge, Info, ShieldAlert, Thermometer } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { demoFacilities } from '@/demo/storage';

export const instant = false;

export default async function FacilityDetailPage({ params }: { params: Promise<{ facilityId: string }> }) {
  const { facilityId } = await params;
  const facility = demoFacilities.find((item) => item.id === facilityId);
  if (!facility) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold text-[#17191D]">Facility unavailable</h1>
          <p className="mt-3 text-[#74767B]">The requested regional facility could not be found.</p>
        </div>
      </AppShell>
    );
  }

  const humidityWarning = facility.humidityPercent > 80;
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600">Certified Facility · Audited &amp; Active</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17191D] sm:text-4xl">{facility.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#74767B]">{facility.description}</p>
            <div className="mt-6 flex min-h-64 items-end rounded-2xl border border-[#22252A] bg-gradient-to-br from-[#17191D] via-[#22252A] to-[#17191D] p-5 shadow-sm">
              <span className="rounded-lg border border-white/10 bg-[#17191D]/90 px-3 py-2 text-xs font-mono font-semibold text-white/80 backdrop-blur">
                Kisii &amp; Nyamira Certified Horticultural Storage Node
              </span>
            </div>
          </div>
          <aside className="h-fit rounded-2xl border border-[#E2DED6] bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#74767B]">Available capacity</p>
            <p className="mt-2 text-3xl font-bold text-[#17191D]">
              {facility.availableCapacityKg.toLocaleString()} <span className="text-sm font-normal text-[#74767B]">kg</span>
            </p>
            <p className="mt-5 border-t border-[#E2DED6] pt-4 text-sm">
              <span className="text-[#74767B]">Tariff rate:</span>{' '}
              <strong className="text-[#17191D]">KSh {facility.pricePerUnit} / kg / day</strong>
            </p>
            <Link
              href={`/storage/${facility.id}/request`}
              className="mt-5 flex h-12 items-center justify-between rounded-xl bg-[#FF5A1F] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#E44E18]"
            >
              Reserve capacity <ArrowRight size={17} />
            </Link>
            <Link
              href={`/storage/${facility.id}/conditions`}
              className="mt-3 flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] text-sm font-bold text-[#17191D] transition hover:border-[#17191D] hover:bg-[#F6F3EC]"
            >
              View condition telemetry
            </Link>
          </aside>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.75fr]">
          <div className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#74767B]">Telemetry &amp; Climate Monitoring</p>
                <h2 className="mt-2 text-2xl font-bold text-[#17191D]">Current storage conditions</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  humidityWarning
                    ? 'border border-[#FFD9CC] bg-[#FFF0EB] text-[#FF5A1F]'
                    : 'border border-[#B3F2DF] bg-[#E6F9F3] text-[#00C896]'
                }`}
              >
                {humidityWarning ? 'Climate Advisory' : 'Optimal Climate Range'}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#74767B]">Live sensor telemetry observed at 09:20 EAT · Calibrated digital monitoring</p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-[#E2DED6] bg-[#E2DED6] sm:grid-cols-2">
              <Condition icon={Thermometer} label="Temperature" value={`${facility.temperatureC}°C`} />
              <Condition icon={Droplets} label="Relative humidity" value={`${facility.humidityPercent}%`} />
              <Condition icon={Gauge} label="Cooling status" value="Active Refrigeration" />
              <Condition icon={ShieldAlert} label="Power and hygiene" value="Solar Backup Normal · Sanitized" />
            </div>
            {humidityWarning && (
              <div className="mt-5 rounded-xl border border-[#FFD9CC] border-l-4 border-l-[#FF5A1F] bg-[#FFF0EB] p-4 text-sm text-[#17191D]">
                <strong className="text-[#FF5A1F]">Climate advisory:</strong> Relative humidity exceeds the ideal 80% threshold for fresh tomatoes. Automated dehumidification cycle engaged.
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#17191D]">Facility overview</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Type" value={facility.facilityType.replace('_', ' ')} />
                <Row label="Location" value={`${facility.locality}, ${facility.county}`} />
                <Row label="Accepted" value={facility.acceptedCommodities.join(', ')} />
                <Row label="Methods" value={facility.storageTypes.join(', ')} />
              </dl>
            </div>
            <div className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#17191D]">
                <Info size={17} className="text-[#FF5A1F]" />
                <h2 className="font-bold">Pricing policy</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#74767B]">
                KSh {facility.pricePerUnit} per kg per day. Certified cold preservation with solar backup and digital intake scale verification.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function Condition({ icon: Icon, label, value }: { icon: typeof Thermometer; label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <Icon size={18} className="text-[#FF5A1F]" />
      <p className="mt-3 text-xs text-[#74767B]">{label}</p>
      <p className="mt-1 font-bold text-[#17191D]">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3 border-b border-[#E2DED6] pb-2 last:border-b-0 last:pb-0">
      <dt className="text-[#74767B]">{label}</dt>
      <dd className="text-right font-semibold text-[#17191D]">{value}</dd>
    </div>
  );
}
