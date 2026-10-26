import { Suspense } from 'react';
import { AppShellClient, DemoNotice as DemoNoticeClient, type WorkspaceRole } from './app-shell-client';

function ShellFallback({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F6F3EC] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]"><div className="hidden w-[248px] bg-[#17191D] lg:block" /><main className="min-w-0">{children}</main></div>;
}

export function AppShell({ children, role = 'farmer' }: { children: React.ReactNode; role?: WorkspaceRole }) {
  return <Suspense fallback={<ShellFallback>{children}</ShellFallback>}><AppShellClient role={role}>{children}</AppShellClient></Suspense>;
}

export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return <DemoNoticeClient>{children}</DemoNoticeClient>;
}
