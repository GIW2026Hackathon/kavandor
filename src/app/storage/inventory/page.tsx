import Link from 'next/link';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';

export default function StoredProducePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Storage inventory" title="My stored produce" description="Compare what you declared with what the facility admitted." action={<Link href="/storage" className="flex h-11 items-center justify-center rounded-lg bg-[#F2C303] px-4 text-sm font-bold text-[#004A25]">Find storage</Link>} />
        <section className="mt-7 border border-[#004A25]/10 bg-white p-5 sm:p-6">
          <span className="rounded-full bg-[#EDF5DF] px-3 py-1 text-xs font-bold">Demo storage received</span><h2 className="mt-4 text-xl font-bold">Tomatoes · KV-2026-001</h2>
          <div className="mt-5 grid grid-cols-2 gap-px bg-[#004A25]/10 sm:grid-cols-4"><Quantity label="Declared" value="220 kg" /><Quantity label="Admitted" value="218 kg" /><Quantity label="Available" value="218 kg" /><Quantity label="Variance" value="−2 kg" /></div>
          <p className="mt-5 text-sm leading-6 text-[#3E594B]">The discrepancy is retained for operator review. The admitted quantity, not the declared quantity, determines current storage availability.</p>
          <dl className="mt-5 grid gap-3 border-t border-[#004A25]/10 pt-5 text-sm sm:grid-cols-3"><div><dt className="text-[#3E594B]">Facility</dt><dd className="mt-1 font-semibold">Kisii Cold Store Demo</dd></div><div><dt className="text-[#3E594B]">Intake</dt><dd className="mt-1 font-semibold">27 Oct · recorded demo</dd></div><div><dt className="text-[#3E594B]">Condition</dt><dd className="mt-1 font-semibold">82% RH warning</dd></div></dl>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#004A25]/10 pt-5 sm:flex-row"><Link href="/storage/facility-01/conditions" className="flex h-11 items-center justify-center rounded-lg border border-[#004A25]/15 px-4 text-sm font-bold">View conditions</Link><button type="button" className="h-11 rounded-lg bg-[#004A25] px-4 text-sm font-bold text-white">Request partial release</button></div>
        </section>
        <div className="mt-6"><DemoNotice>Inventory and quantity variance are demonstration records.</DemoNotice></div>
      </div>
    </AppShell>
  );
}

function Quantity({ label, value }: { label: string; value: string }) { return <div className="bg-white p-4"><p className="text-xs text-[#3E594B]">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>; }
