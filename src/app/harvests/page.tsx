import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { HarvestCard } from '@/components/dashboard/harvest-card';
import { PageHeader } from '@/components/ui/page-header';

export default function HarvestsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Farmer workspace" title="My harvests" description="Track registered produce from intake to final outcome." action={<Link href="/harvests/new" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#F2C303] px-4 text-sm font-bold"><Plus size={18} /> Register harvest</Link>} />
        <section className="mt-7 border border-[#004A25]/10 bg-white p-5 sm:p-6">
          <HarvestCard crop="Tomatoes" quantity={220} unit="kg" harvestDate="26 Oct 2026" location="Nyakundi farm · Kisii" status="assessed" action="Review harvest" href="/harvests/demo-harvest-001" />
          <HarvestCard crop="Bananas" quantity={8} unit="crate" harvestDate="24 Oct 2026" location="Nyakundi farm · Kisii" status="offer_pending" action="Review offer" href="/offers" />
        </section>
        <div className="mt-6"><DemoNotice /></div>
      </div>
    </AppShell>
  );
}
