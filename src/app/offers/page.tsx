import { Suspense } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { OffersClient } from '@/components/offers/offers-client';

export const instant = false;

export default function OffersPage() {
  return (
    <AppShell allowedRoles={['farmer', 'buyer', 'operations_admin']}>
      <Suspense fallback={<div className="mx-auto max-w-[1180px] p-8 text-center text-[#74767B]">Loading offers...</div>}>
        <OffersClient />
      </Suspense>
    </AppShell>
  );
}
