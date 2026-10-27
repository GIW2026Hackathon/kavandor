import { Suspense } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { StorageDiscoveryClient } from '@/components/storage/storage-discovery-client';

export const instant = false;

export const metadata = {
  title: 'Value-Addition Network | KAVANDOR',
  description: 'Connect your harvest directly with vetted cold rooms, puree pulping, solar dehydration, cooperative pooling, dairy chilling, and haulage in Kisii & Nyamira.',
};

export default function ValueAdditionDiscoveryPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="mx-auto max-w-[1180px] p-8 text-center text-[#74767B]">Loading certified value-addition facilities...</div>}>
        <StorageDiscoveryClient />
      </Suspense>
    </AppShell>
  );
}
