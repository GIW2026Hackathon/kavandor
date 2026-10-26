import { Suspense } from 'react';
import { AppShellClient, DemoNotice as DemoNoticeClient } from './app-shell-client';

function ShellFallback({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FFFFFF] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]"><div className="hidden w-[248px] bg-[#004A25] lg:block" /><main className="min-w-0">{children}</main></div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<ShellFallback>{children}</ShellFallback>}><AppShellClient>{children}</AppShellClient></Suspense>;
}

export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return <DemoNoticeClient>{children}</DemoNoticeClient>;
}
