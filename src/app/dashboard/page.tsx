import Link from 'next/link';
import { connection } from 'next/server';
import {
  ArrowRight,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  PackagePlus,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { HarvestCard } from '@/components/dashboard/harvest-card';
import { type HarvestStatus } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
import { resolveAuthContext } from '@/lib/auth-server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export const instant = false;

export default async function DashboardPage() {
  await connection();
  const profile = await resolveAuthContext();

  // Load actual harvests and events from Supabase
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

  let activityEvents: Array<{
    id: string;
    event_type: string;
    details: Record<string, unknown> | null;
    created_at: string;
  }> = [];

  let pendingOffersCount = 0;

  try {
    const client = await createSupabaseServerClient();
    const { data: hData, error: hError } = await client
      .from('harvests')
      .select('id, crop, quantity, unit, harvest_date, location, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (hError || !hData) {
      // Fallback to admin client if session is not synced
      const admin = createSupabaseAdminClient();
      if (admin) {
        const { data: adminH } = await admin
          .from('harvests')
          .select('id, crop, quantity, unit, harvest_date, location, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        if (adminH) harvests = adminH;
      }
    } else {
      harvests = hData;
    }

    const { data: offersData } = await (client || createSupabaseAdminClient())
      .from('offers')
      .select('id')
      .eq('status', 'pending');
    pendingOffersCount = offersData?.length ?? 0;

    const { data: eventsData } = await (client || createSupabaseAdminClient())
      .from('activity_events')
      .select('id, event_type, details, created_at')
      .order('created_at', { ascending: false })
      .limit(6);
    if (eventsData) activityEvents = eventsData;
  } catch {
    // Non-blocking fallback
  }

  const activeCount = harvests.filter((h) => h.status !== 'cancelled' && h.status !== 'sold').length;
  const readyForDecision = harvests.find((h) => h.status === 'assessed' || h.status === 'submitted' || h.status === 'draft') || harvests[0];

  const nowFormatted = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <PageHeader
          eyebrow={nowFormatted}
          title={`Welcome, ${profile.fullName.split(' ')[0]}`}
          description="Find the right infrastructure and next move for each harvest, from preservation and processing to market preparation."
          action={
            <Link
              href="/harvests/new"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98"
            >
              <PackagePlus size={18} /> Register new harvest
            </Link>
          }
        />

        {/* Live Metrics Grid */}
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Active harvests',
              value: String(activeCount),
              detail: activeCount === 1 ? '1 active batch' : `${activeCount} batches in network`,
              icon: Sprout,
            },
            {
              label: 'Pending buyer offers',
              value: String(pendingOffersCount),
              detail: pendingOffersCount > 0 ? 'Pending your review' : 'No pending offers',
              icon: TrendingUp,
            },
            {
              label: 'Verified cold hubs',
              value: '3',
              detail: 'Kisii & Nyamira Network',
              icon: ClipboardCheck,
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-[#E2DED6] border-l-4 border-l-[#FF5A1F] bg-white px-5 py-4 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#74767B]">{metric.label}</p>
                <metric.icon size={18} className="text-[#FF5A1F]" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-[#17191D] font-mono">{metric.value}</p>
              <p className="mt-1 text-xs text-[#74767B]">{metric.detail}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 flex flex-col gap-5 rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="max-w-3xl">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Explore more than storage</p>
            <h2 className="mt-2 text-xl font-bold text-[#17191D]">Agri-Value Chain Facilities</h2>
            <p className="mt-2 text-sm leading-6 text-[#74767B]">
              Discover cold rooms, drying centres, mills, processors and aggregation hubs. Compare known service fees, capacity and what each option may help you achieve.
            </p>
          </div>
          <Link href="/storage" className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#17191D] px-5 text-sm font-bold text-white transition hover:bg-[#22252A]">
            Explore facilities <ChevronRight size={18} />
          </Link>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.7fr)]">
          {/* Main Column: Actual Harvests */}
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F] tracking-wider">My harvests</p>
                <h2 className="mt-1 text-xl font-bold text-[#17191D]">Produce in progress</h2>
              </div>
              <Link href="/harvests" className="text-sm font-bold text-[#FF5A1F] hover:underline">
                View all ({harvests.length})
              </Link>
            </div>

            {harvests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E2DED6] p-8 text-center bg-[#FAF9F5]">
                <Sprout size={36} className="mx-auto text-[#FF5A1F]" />
                <h3 className="mt-3 text-base font-bold text-[#17191D]">No harvests registered yet</h3>
                <p className="mt-1 text-xs leading-5 text-[#74767B] max-w-sm mx-auto">
                  Register your first harvest to receive instant quality appraisal, compare cold storage tariffs, and connect with verified buyers.
                </p>
                <Link
                  href="/harvests/new"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-4 text-xs font-bold text-white shadow-sm"
                >
                  <PackagePlus size={16} /> Register First Harvest
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {harvests.slice(0, 4).map((h) => {
                  const dateStr = new Date(h.harvest_date).toLocaleDateString('en-KE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <HarvestCard
                      key={h.id}
                      crop={h.crop}
                      quantity={Number(h.quantity)}
                      unit={h.unit}
                      harvestDate={dateStr}
                      location={h.location}
                      status={h.status as HarvestStatus}
                      action="Review harvest"
                      href={`/harvests/${h.id}`}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Column: Next Moves & Attention */}
          <aside className="space-y-6">
            {readyForDecision ? (
              <section className="rounded-2xl bg-[#17191D] p-5 text-white sm:p-6 border border-[#22252A] shadow-md">
                <div className="flex items-center gap-2 text-[#FF5A1F]">
                  <CircleAlert size={18} />
                  <p className="text-xs font-mono font-bold uppercase tracking-wider">Actionable Next Move</p>
                </div>
                <h2 className="mt-3 text-xl font-bold text-white">
                  Compare pathways for {readyForDecision.crop}
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Compare what your {readyForDecision.quantity} {readyForDecision.unit} {readyForDecision.crop} lot could earn across immediate wholesale, cold preservation, and value-added drying.
                </p>
                <Link
                  href={`/harvests/${readyForDecision.id}/compare`}
                  className="mt-5 flex h-11 items-center justify-between rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-4 text-sm font-bold text-white transition shadow-sm"
                >
                  <span>Compare preservation pathways</span> <ChevronRight size={18} />
                </Link>
              </section>
            ) : null}

            <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-lg font-bold text-[#17191D]">Key Workflows</h2>
              <div className="mt-4 divide-y divide-[#E2DED6]">
                {[
                  {
                    label: readyForDecision ? `Inspect ${readyForDecision.crop} appraisal` : 'Register a harvest',
                    href: readyForDecision ? `/harvests/${readyForDecision.id}` : '/harvests/new',
                  },
                  {
                    label: 'Explore certified cold hubs',
                    href: readyForDecision ? `/storage?harvestId=${readyForDecision.id}&crop=${readyForDecision.crop}&quantity=${readyForDecision.quantity}` : '/storage',
                  },
                  {
                    label: 'Check buyer purchase offers',
                    href: '/offers',
                  },
                  {
                    label: 'View stored produce batches',
                    href: '/storage/inventory',
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between py-3 text-sm font-semibold text-[#17191D] hover:text-[#FF5A1F] transition-colors"
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {/* Recent Network Activity from Ledger */}
        <section className="mt-8 border-t border-[#E2DED6] pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#17191D]">Recent Network Activity</h2>
            <Link href="/storage/alerts" className="text-xs font-bold text-[#FF5A1F] hover:underline">
              View Activity Log
            </Link>
          </div>
          <div className="mt-4 grid gap-px bg-[#E2DED6] md:grid-cols-3 rounded-xl overflow-hidden border border-[#E2DED6]">
            {activityEvents.length > 0 ? (
              activityEvents.map((evt) => {
                const time = new Date(evt.created_at).toLocaleTimeString('en-KE', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={evt.id} className="bg-white px-4 py-4 md:px-5">
                    <p className="text-xs font-mono font-semibold text-[#74767B]">Today, {time} EAT</p>
                    <p className="mt-2 text-sm font-bold text-[#17191D] capitalize">
                      {evt.event_type.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#74767B]">
                      {typeof evt.details === 'object' && evt.details?.title
                        ? String(evt.details.title)
                        : 'Recorded on KAVANDOR network ledger.'}
                    </p>
                  </div>
                );
              })
            ) : (
              [
                { label: 'Network ready', detail: 'Kisii & Nyamira cold hubs online', time: 'Active' },
                { label: 'Intake scales calibrated', detail: 'Digital scales tare certified', time: 'Active' },
                { label: 'Transport fleet standby', detail: 'Horticultural haulage ready', time: 'Active' },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-4 md:px-5">
                  <p className="text-xs font-mono font-semibold text-emerald-600">{item.time}</p>
                  <p className="mt-2 text-sm font-bold text-[#17191D]">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#74767B]">{item.detail}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
