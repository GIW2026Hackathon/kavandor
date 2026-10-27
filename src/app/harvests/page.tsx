import Link from 'next/link';
import { Plus, Sprout } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { HarvestCard } from '@/components/dashboard/harvest-card';
import { type HarvestStatus } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const instant = false;

export default async function HarvestsPage() {
  let harvests: Array<{
    id: string;
    crop: string;
    quantity: number;
    unit: string;
    harvest_date: string;
    location: string;
    status: string;
    created_at: string;
  }> = [];

  try {
    const client = await createSupabaseServerClient();
    const { data, error } = await client
      .from('harvests')
      .select('id, crop, quantity, unit, harvest_date, location, status, created_at')
      .order('created_at', { ascending: false });

    if (error || !data) {
      const admin = createSupabaseAdminClient();
      if (admin) {
        const { data: adminData } = await admin
          .from('harvests')
          .select('id, crop, quantity, unit, harvest_date, location, status, created_at')
          .order('created_at', { ascending: false });
        if (adminData) harvests = adminData;
      }
    } else {
      harvests = data;
    }
  } catch {
    // Non-blocking fallback
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Farmer workspace"
          title="My harvests"
          description="Track registered produce from harvest intake to cold chain storage, preservation, or wholesale buyer settlement."
          action={
            <Link
              href="/harvests/new"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98"
            >
              <Plus size={18} /> Register harvest
            </Link>
          }
        />

        <section className="mt-7 rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
          {harvests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E2DED6] p-12 text-center bg-[#FAF9F5]">
              <Sprout size={40} className="mx-auto text-[#FF5A1F]" />
              <h2 className="mt-4 text-lg font-bold text-[#17191D]">No harvests registered yet</h2>
              <p className="mt-1 text-sm text-[#74767B] max-w-md mx-auto">
                Capture your harvest load details and photos to receive instant condition grading and evaluate local cold storage versus immediate sale.
              </p>
              <Link
                href="/harvests/new"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-6 text-sm font-bold text-white shadow-sm transition active:scale-98"
              >
                <Plus size={18} /> Register First Harvest
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E2DED6]">
              {harvests.map((h) => {
                const dateStr = new Date(h.harvest_date).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <div key={h.id} className="py-2 first:pt-0 last:pb-0">
                    <HarvestCard
                      crop={h.crop}
                      quantity={Number(h.quantity)}
                      unit={h.unit}
                      harvestDate={dateStr}
                      location={h.location}
                      status={h.status as HarvestStatus}
                      action="Review harvest"
                      href={`/harvests/${h.id}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
