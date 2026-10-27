import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { resolveAuthContext } from '@/lib/auth-server';
import { ShieldCheck, AlertCircle, Building2 } from 'lucide-react';

export const instant = false;

export default async function ProfilePage() {
  await connection();
  const profile = await resolveAuthContext();

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Account & Security"
          title="Profile & Workspace Permissions"
          description="Manage your verified participant identity, operating geography, and role permissions."
        />

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-7 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="grid size-14 place-items-center rounded-2xl bg-[#17191D] text-lg font-bold text-white shadow-sm">
                  {profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-[#17191D]">{profile.fullName}</h2>
                  <p className="text-sm text-[#74767B]">{profile.email}</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                Verified Profile
              </span>
            </div>

            <div className="mt-7 border-t border-[#E2DED6] pt-6">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
                Participant Details
              </h3>
              <dl className="mt-4 divide-y divide-[#E2DED6] text-sm">
                <div className="grid grid-cols-[140px_1fr] gap-4 py-3">
                  <dt className="text-[#74767B]">Participant ID</dt>
                  <dd className="font-mono text-xs font-semibold text-[#17191D] truncate">{profile.userId}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 py-3">
                  <dt className="text-[#74767B]">Approved Role</dt>
                  <dd className="font-semibold text-[#17191D] capitalize">
                    {profile.role.replace('_', ' ')}
                  </dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 py-3">
                  <dt className="text-[#74767B]">Operating Location</dt>
                  <dd className="font-semibold text-[#17191D]">{profile.location}</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 py-3">
                  <dt className="text-[#74767B]">Network Authority</dt>
                  <dd className="font-semibold text-[#17191D]">Kisii &amp; Nyamira Agricultural Hub</dd>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 py-3">
                  <dt className="text-[#74767B]">Session Type</dt>
                  <dd className="font-semibold text-[#17191D]">
                    {profile.isDemo ? 'Verified Seeded Demo Profile' : 'Live Supabase Authenticated'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-7 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs leading-relaxed text-blue-900 flex items-start gap-3">
              <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Server-Enforced Role Governance</p>
                <p className="mt-0.5 text-blue-800">
                  KAVANDOR enforces role authorization on the server and database. Workspace permissions are derived strictly from your approved participant record in PostgreSQL and cannot be altered via client tampering.
                </p>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-[#22252A] bg-[#17191D] p-5 text-white sm:p-6 shadow-md">
              <ShieldCheck size={28} className="text-[#FF5A1F]" />
              <h2 className="mt-4 text-lg font-bold text-white">Trust &amp; Verification</h2>
              <p className="mt-2 text-xs leading-5 text-neutral-300">
                All physical transactions, cold bay check-ins, and escrow payments require cryptographic validation and electronic scale records.
              </p>
              <div className="mt-5 border-t border-white/10 pt-4 text-xs text-neutral-400">
                <p>Kisii Central Packhouse ID: <strong>KCH-01</strong></p>
                <p className="mt-1">Nyamira Aggregation ID: <strong>NVSC-02</strong></p>
              </div>
            </section>

            <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 text-[#17191D]">
                <Building2 size={18} className="text-[#FF5A1F]" />
                <h3 className="font-bold">Need a different role?</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#74767B]">
                To request commercial buyer or cold room operator accreditation, submit verification credentials to KAVANDOR regional operations.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
