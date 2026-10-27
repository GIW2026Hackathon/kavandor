import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { FacilityDetails } from '@/components/facilities/facility-details';

export const instant = false;

export default async function FacilityDetailsPage({ params }: { params: Promise<{ facilityId: string }> }) {
  await connection();
  const { facilityId } = await params;
  return <AppShell><FacilityDetails facilityId={facilityId} /></AppShell>;
}
