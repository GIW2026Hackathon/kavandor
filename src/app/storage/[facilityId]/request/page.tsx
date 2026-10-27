import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { StorageRequestWizard } from '@/components/storage/storage-request-wizard';
import { findFacility } from '@/data/facilities';

export const instant = false;

export default async function StorageRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ facilityId: string }>;
  searchParams: Promise<{ harvestId?: string; quantity?: string; crop?: string }>;
}) {
  await connection();
  const { facilityId } = await params;
  const { harvestId, quantity, crop } = await searchParams;
  const facility = findFacility(facilityId);
  if (!facility) notFound();

  return (
    <AppShell allowedRoles={['farmer', 'operations_admin']}>
      <StorageRequestWizard
        facility={facility}
        initialHarvestId={harvestId}
        initialQuantity={quantity}
        initialCrop={crop}
      />
    </AppShell>
  );
}
