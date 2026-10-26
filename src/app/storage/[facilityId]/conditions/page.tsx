import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { demoFacilities } from '@/demo/storage';
import { notFound } from 'next/navigation';

export const instant = false;

export default async function ConditionsPage({ params }: { params: Promise<{ facilityId: string }> }) {
  const { facilityId } = await params;
  const facility = demoFacilities.find((item) => item.id === facilityId);
  if (!facility) notFound();
  const history = [
    { time: '08:45', temperature: 11.6, humidity: 79 },
    { time: '09:20', temperature: facility.temperatureC, humidity: facility.humidityPercent },
  ];
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
        <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">Last reported inspection · demo</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17191D] sm:text-4xl">Storage conditions</h1>
        <p className="mt-2 text-sm text-[#74767B]">{facility.name}</p>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <Metric label="Temperature" value={`${facility.temperatureC}°C`} status="Within demo target" />
          <Metric label="Relative humidity" value={`${facility.humidityPercent}%`} status="Warning — review required" warning />
          <Metric label="Data age" value="3 hours" status="Recent demo reading" />
        </div>

        <section className="mt-6 rounded-2xl border border-[#E2DED6] bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold text-[#17191D]">Manual inspection history</h2>
          <p className="mt-2 text-sm leading-6 text-[#74767B]">
            Only recorded operator observations are shown. These points are not continuous sensor measurements.
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

        <section className="mt-6 rounded-xl border border-[#FFD9CC] border-l-4 border-l-[#FF5A1F] bg-[#FFF0EB] p-5">
          <h2 className="font-bold text-[#17191D]">Open demo incident</h2>
          <p className="mt-2 text-sm leading-6 text-[#17191D]">
            Reported humidity reached 82%. The operator should inspect ventilation and moisture control. This reading does not establish produce spoilage.
          </p>
        </section>

        <div className="mt-6">
          <DemoNotice>Facility-specific demo targets, operator records and two inspection observations. No live sensor connection.</DemoNotice>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, status, warning = false }: { label: string; value: string; status: string; warning?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#E2DED6] bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-[#74767B]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#17191D]">{value}</p>
      <p className={`mt-3 text-xs font-bold ${warning ? 'text-[#FF5A1F]' : 'text-[#00C896]'}`}>{status}</p>
    </div>
  );
}
