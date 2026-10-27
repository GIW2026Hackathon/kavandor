import { AppShell } from '@/components/layout/app-shell';
import { FacilityDiscovery } from '@/components/facilities/facility-discovery';

export const instant = false;

export default function FacilityDiscoveryPage() {
  return <AppShell><FacilityDiscovery /></AppShell>;
}
