import { AppShell } from '@/components/layout/app-shell';
import { FacilityDiscovery } from '@/components/facilities/facility-discovery';
import type { FarmerFacilitySection } from '@/components/facilities/farmer-facility-sections';

export const instant = false;

export default async function FacilityDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const { section } = await searchParams;
  const initialSection: FarmerFacilitySection =
    section === 'requests' || section === 'inventory' || section === 'alerts' ? section : 'discover';
  return <AppShell><FacilityDiscovery key={initialSection} initialSection={initialSection} /></AppShell>;
}
