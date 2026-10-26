import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { StorageRequestWizard } from '@/components/storage/storage-request-wizard';
import { findFacility } from '@/demo/storage';

export const instant = false;

export default async function StorageRequestPage({ params }: { params: Promise<{ facilityId: string }> }) {
  const { facilityId } = await params;
  const facility = findFacility(facilityId);
  if (!facility) notFound();
  return <AppShell><StorageRequestWizard facility={facility} /></AppShell>;
}
