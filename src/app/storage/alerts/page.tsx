import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

const alerts = [
  { severity: 'Warning', title: 'Climate Advisory: Chamber Humidity at 82%', detail: 'Sensor reading exceeds 80% RH target at Kisii Central Cold Store Hub. Automated dehumidifier cycle active.', source: 'Digital Telemetry Sensor', status: 'Active', time: 'Today · 09:20 EAT' },
  { severity: 'Notice', title: 'Capacity Reserved: Lot KV-2026-001', detail: '220 kg cold capacity locked for Nyakundi farmgate arrival.', source: 'KAVANDOR Allocation Ledger', status: 'Confirmed', time: 'Today · 08:30 EAT' },
  { severity: 'Notice', title: 'Logistics Dispatch Assigned', detail: 'Vehicle Probox KDH 412X en route for scheduled farmgate collection.', source: 'Transport Dispatch Service', status: 'En Route', time: 'Today · 08:45 EAT' },
];

export const instant = false;

export default function StorageAlertsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Operational Telemetry" title="Storage & Facility Alerts" description="Live cold chain telemetry notifications, capacity locks, and dispatch updates." />
        <div className="mt-7 grid gap-4">
          {alerts.map((alert) => (
            <article
              key={alert.title}
              className={`grid gap-4 rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm sm:grid-cols-[150px_1fr_auto] ${
                alert.severity === 'Warning' ? 'border-l-4 border-l-[#FF5A1F]' : 'border-l-4 border-l-[#00C896]'
              }`}
            >
              <div>
                <span
                  className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    alert.severity === 'Warning' ? 'text-[#FF5A1F]' : 'text-emerald-700'
                  }`}
                >
                  {alert.severity}
                </span>
                <p className="mt-2 text-xs text-[#74767B]">{alert.time}</p>
              </div>
              <div>
                <h2 className="font-bold text-[#17191D]">{alert.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#74767B]">{alert.detail}</p>
                <p className="mt-2 text-xs text-[#9E9E9E]">Source: {alert.source}</p>
              </div>
              <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${
                alert.status === 'Active'
                  ? 'border border-[#FFD9CC] bg-[#FFF0EB] text-[#FF5A1F]'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}>
                {alert.status}
              </span>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
