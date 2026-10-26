import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

const alerts = [
  { severity: 'Warning', title: 'Humidity outside demo target', detail: '82% RH was reported by the Kisii Cold Store demo operator at 09:20. Investigate ventilation and moisture control.', source: 'Operator-maintained demo inspection', status: 'Open', time: '26 Oct 2026 · 09:20' },
  { severity: 'Info', title: 'Storage request awaiting review', detail: 'STORAGE-DEMO-001 requires facility confirmation before arrival.', source: 'KAVANDOR demo booking', status: 'Open', time: '26 Oct 2026 · 12:21' },
  { severity: 'Info', title: 'Transport quote not available', detail: 'SONGA-DEMO-001 has not sent a request to a live provider. No vehicle or driver is assigned.', source: 'Demo integration adapter', status: 'Open', time: '26 Oct 2026 · 12:21' },
];

export default function StorageAlertsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Attention required" title="Storage alerts" description="Review condition observations and booking follow-ups." />
        <div className="mt-7 grid gap-4">
          {alerts.map((alert) => (
            <article
              key={alert.title}
              className={`grid gap-4 rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm sm:grid-cols-[150px_1fr_auto] ${
                alert.severity === 'Warning' ? 'border-l-4 border-l-[#FF5A1F]' : 'border-l-4 border-l-[#17191D]'
              }`}
            >
              <div>
                <span
                  className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    alert.severity === 'Warning' ? 'text-[#FF5A1F]' : 'text-[#74767B]'
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
              <span className="h-fit rounded-full border border-[#FFD9CC] bg-[#FFF0EB] px-3 py-1 text-xs font-bold text-[#FF5A1F]">
                {alert.status}
              </span>
            </article>
          ))}
        </div>
        <div className="mt-6"><DemoNotice>Alerts represent seeded demonstration records; they do not prove produce spoilage or dispatch status.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
