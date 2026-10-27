import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { FacilityRequestList } from '@/components/facilities/facility-request-list';
import { PageHeader } from '@/components/ui/page-header';

export const instant = false;

export default async function FacilityRequestsPage() {
  await connection();
  return (
    <AppShell allowedRoles={['farmer', 'facility_operator', 'operations_admin']}>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Farmer workspace"
          title="Facility requests"
          description="Track provider review status for your facility service requests."
        />
        <FacilityRequestList />
      </div>
    </AppShell>
  );
}
