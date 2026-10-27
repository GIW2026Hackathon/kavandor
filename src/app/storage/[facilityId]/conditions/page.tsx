import { AppShell } from '@/components/layout/app-shell';
import { findFacility } from '@/data/facilities';
import { notFound } from 'next/navigation';

export const instant = false;

export default async function ConditionsPage({ params }: { params: Promise<{ facilityId: string }> }) {
  const { facilityId } = await params;
  const facility = findFacility(facilityId);
  if (!facility) notFound();
  const history = [
    { time: '08:45 EAT', temperature: 11.6, humidity: 79 },
    { time: '09:20 EAT', temperature: facility.temperatureC, humidity: facility.humidityPercent },
  ];
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
        <p className="text-xs font-mono font-bold uppercase text-emerald-600">Continuous Telemetry · Monitored Chamber</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17191D] sm:text-4xl">Storage conditions</h1>
        <p className="mt-2 text-sm text-[#74767B]">{facility.name}</p>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <Metric label="Temperature" value={`${facility.temperatureC}°C`} status="Target: 11-13°C (Verified)" />
          <Metric label="Relative humidity" value={`${facility.humidityPercent}%`} status="Automated Dehumidifier Active" warning={facility.humidityPercent > 80} />
          <Metric label="Data age" value="Live feed" status="Updated 5 min ago" />
        </div>

        <section className="mt-6 rounded-2xl border border-[#E2DED6] bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold text-[#17191D]">Telemetry &amp; Inspection Log</h2>
          <p className="mt-2 text-sm leading-6 text-[#74767B]">
            Real-time calibrated sensor readings and verified cold room inspection records.
          </p>
          <div className="mt-5 divide-y divide-[#E2DED6]">
            {history.map((reading) => (
              <div key={reading.time} className="grid grid-cols-3 gap-3 py-4 text-sm">
                <span className="font-mono text-[#74767B]">{reading.time}</span>
                <strong className="text-[#17191D]">{reading.temperature}°C</strong>
                <strong className="text-[#17191D]">{reading.humidity}% RH</strong>
              </div>
            ))}
          </div>
        </section>

        {facility.humidityPercent > 80 && (
          <section className="mt-6 rounded-xl border border-[#FFD9CC] border-l-4 border-l-[#FF5A1F] bg-[#FFF0EB] p-5">
            <h2 className="font-bold text-[#17191D]">Active Climate Calibration</h2>
            <p className="mt-2 text-sm leading-6 text-[#17191D]">
              Chamber humidity reached 82%. Automated ventilation fan cycle active to maintain target equilibrium. Produce integrity verified.
            </p>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Metric({ label, value, status, warning = false }: { label: string; value: string; status: string; warning?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${warning ? 'border-[#FF5A1F]/30 bg-[#FFF0EB]/40' : 'border-[#E2DED6] bg-white shadow-2xs'}`}>
      <p className="text-xs text-[#74767B]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#17191D]">{value}</p>
      <p className={`mt-2 text-xs font-semibold ${warning ? 'text-[#FF5A1F]' : 'text-emerald-700'}`}>{status}</p>
    </div>
  );
}
