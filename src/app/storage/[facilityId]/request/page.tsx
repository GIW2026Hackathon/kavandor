import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { StorageRequestWizard } from '@/components/storage/storage-request-wizard';
import { demoFacilities } from '@/demo/storage';

export const instant = false;

export default async function StorageRequestPage({ params }: { params: Promise<{ facilityId: string }> }) {
  const { facilityId } = await params;
  const facility = demoFacilities.find((item) => item.id === facilityId);
  if (!facility) notFound();
  return <AppShell><StorageRequestWizard facility={facility} /></AppShell>;
}
