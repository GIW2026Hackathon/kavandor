import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

export default function StoredProducePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Storage inventory"
          title="My stored produce"
          description="Audited cold room inventory records and scale tare reconciliation."
          action={
            <Link
              href="/storage"
              className="flex h-11 items-center justify-center rounded-xl bg-[#FF5A1F] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#E44E18]"
            >
              Find storage
            </Link>
          }
        />
        <section className="mt-7 rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-sm sm:p-6">
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            Admitted to Chamber A-03
          </span>
          <h2 className="mt-4 text-xl font-bold text-[#17191D]">Tomatoes · KV-2026-001</h2>
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E2DED6] bg-[#E2DED6] sm:grid-cols-4">
            <Quantity label="Declared" value="220 kg" />
            <Quantity label="Admitted" value="218 kg" />
            <Quantity label="Available" value="218 kg" />
            <Quantity label="Variance" value="−2 kg (0.9%)" />
          </div>
          <p className="mt-5 text-sm leading-6 text-[#74767B]">
            Scale variance is within the 5% allowable threshold. The certified admitted weight (218 kg) determines capacity ledger occupancy and final financial clearance.
          </p>
          <dl className="mt-5 grid gap-3 border-t border-[#E2DED6] pt-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wider text-[#74767B]">Facility</dt>
              <dd className="mt-1 font-semibold text-[#17191D]">Kisii Central Cold Store Hub</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-[#74767B]">Intake Log</dt>
              <dd className="mt-1 font-semibold text-[#17191D]">27 Oct · Scale Tare Verified</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-[#74767B]">Chamber Climate</dt>
              <dd className="mt-1 font-semibold text-[#FF5A1F]">11.8°C · 82% RH Advisory</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#E2DED6] pt-5 sm:flex-row">
            <Link
              href="/storage/facility-01/conditions"
              className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] px-4 text-sm font-bold text-[#17191D] transition hover:border-[#17191D] hover:bg-[#F6F3EC]"
            >
              View chamber telemetry
            </Link>
            <button
              type="button"
              className="h-11 rounded-xl bg-[#17191D] px-4 text-sm font-bold text-white transition hover:bg-[#22252A]"
            >
              Request partial release
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Quantity({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[#74767B]">{label}</p>
      <p className="mt-2 text-xl font-bold text-[#17191D]">{value}</p>
    </div>
  );
}
