import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { resolveAuthContext, type AuthenticatedUserProfile } from '@/lib/auth-server';
import type { UserRole } from '@/lib/backend';
import { AppShellClient, DemoNotice as DemoNoticeClient } from './app-shell-client';

function ShellFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F3EC] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="hidden w-[260px] bg-[#17191D] lg:block" />
      <main className="min-w-0">{children}</main>
    </div>
  );
}

export async function AppShell({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const profile: AuthenticatedUserProfile = await resolveAuthContext();

  // Enforce server-side role authorization if allowedRoles are specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen bg-[#F6F3EC] flex items-center justify-center p-6 text-[#212329]">
        <div className="max-w-md w-full rounded-3xl bg-white border border-[#E2DED6] p-8 shadow-xl text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#FFF0EB] text-[#FF5A1F]">
            <ShieldAlert size={32} />
          </span>
          <p className="mt-5 text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
            Role Authorization Boundary
          </p>
          <h1 className="mt-2 text-2xl font-black text-[#17191D]">Access Restricted</h1>
          <p className="mt-3 text-sm leading-6 text-[#74767B]">
            This workspace requires an approved <strong>{allowedRoles.join(' or ')}</strong> role.
            Your authenticated profile is registered as <strong>{profile.role.replace('_', ' ')}</strong> ({profile.fullName}).
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link
              href={
                profile.role === 'farmer'
                  ? '/dashboard'
                  : profile.role === 'facility_operator'
                  ? '/partners'
                  : profile.role === 'transport_provider'
                  ? '/transport'
                  : '/marketplace'
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] text-sm font-bold text-white shadow-sm transition active:scale-98"
            >
              <ArrowLeft size={16} /> Return to My Workspace
            </Link>
            <Link
              href="/profile"
              className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition"
            >
              View Profile &amp; Role Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<ShellFallback>{children}</ShellFallback>}>
      <AppShellClient userProfile={profile}>{children}</AppShellClient>
    </Suspense>
  );
}

export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return <DemoNoticeClient>{children}</DemoNoticeClient>;
}
