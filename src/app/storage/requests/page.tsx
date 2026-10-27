import Link from 'next/link';
import { ArrowRight, Calendar, Warehouse } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export const instant = false;

interface StorageReservationRow {
  id: string;
  harvest_id: string;
  facility_id: string;
  quantity_kg: number;
  requested_start_at: string;
  expected_end_at: string;
  status: string;
  created_at: string;
  harvests: { id: string; crop: string; quantity: number; unit: string; location: string } | null;
  facilities: { id: string; name: string; location: string; county: string; price_per_unit: number } | null;
}

export default async function StorageRequestsPage() {
  const admin = createSupabaseAdminClient();
  let reservations: StorageReservationRow[] = [];

  if (admin) {
    try {
      const { data, error } = await admin
        .from('reservations')
        .select(`
          id,
          harvest_id,
          facility_id,
          quantity_kg,
          requested_start_at,
          expected_end_at,
          status,
          created_at,
          harvests (id, crop, quantity, unit, location),
          facilities (id, name, location, county, price_per_unit)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        reservations = data as unknown as StorageReservationRow[];
      }
    } catch (err) {
      console.error('Failed to query reservations:', err);
    }
  }

  return (
    <AppShell allowedRoles={['farmer', 'facility_operator', 'operations_admin']}>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Cold Chain Network"
          title="Storage reservations"
          description="Manage active and reserved climate-controlled capacity slots across Kisii & Nyamira."
          action={
            <Link
              href="/storage"
              className="flex h-11 items-center justify-center rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98"
            >
              Reserve new storage
            </Link>
          }
        />

        {reservations.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-dashed border-[#E2DED6] bg-white p-12 text-center">
            <Warehouse size={40} className="mx-auto text-[#74767B]/60" />
            <h2 className="mt-4 text-lg font-bold text-[#17191D]">No active storage reservations yet</h2>
            <p className="mt-2 text-sm text-[#74767B] max-w-md mx-auto">
              You haven&apos;t reserved cold room capacity yet. Register a harvest and evaluate preservation pathways to lock in space.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/storage"
                className="flex h-11 items-center justify-center rounded-xl bg-[#FF5A1F] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#E44E18] transition"
              >
                Find cold storage
              </Link>
              <Link
                href="/harvests/new"
                className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition"
              >
                Register harvest
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-7 space-y-5">
            {reservations.map((res) => {
              const harvest = res.harvests;
              const facility = res.facilities;
              const statusColors: Record<string, string> = {
                confirmed: 'border-emerald-300 bg-emerald-50 text-emerald-800',
                pending: 'border-amber-300 bg-amber-50 text-amber-800',
                cancelled: 'border-red-300 bg-red-50 text-red-800',
                completed: 'border-blue-300 bg-blue-50 text-blue-800',
              };

              const badgeClass = statusColors[res.status] || 'border-gray-300 bg-gray-50 text-gray-800';

              return (
                <article
                  key={res.id}
                  className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:p-6 transition hover:border-[#FF5A1F]/60"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase ${badgeClass}`}>
                        {res.status === 'confirmed' ? 'Capacity Confirmed' : res.status}
                      </span>
                      <h2 className="mt-3 text-xl font-bold text-[#17191D]">
                        {harvest?.crop || 'Produce'} · {res.quantity_kg} kg
                      </h2>
                      <p className="mt-1 font-mono text-xs text-[#74767B]">
                        Reservation #{res.id.slice(0, 8)} · {facility?.name || 'Kisii Central Cold Store Hub'}
                      </p>
                      <p className="mt-2 text-sm text-[#74767B] flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#FF5A1F]" />
                        Intake Arrival: {res.requested_start_at ? new Date(res.requested_start_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Scheduled'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs font-mono uppercase tracking-wider text-[#74767B]">Tariff Basis</p>
                      <p className="mt-1 font-bold font-mono text-[#17191D]">
                        KSh {facility?.price_per_unit || 3.20} / kg / day
                      </p>
                      <p className="mt-1 text-xs text-[#74767B]">Digital weighbridge gate audit</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 border-t border-[#E2DED6] pt-5 sm:flex-row">
                    <Link
                      href={`/storage/requests/${res.id}`}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98"
                    >
                      View reservation <ArrowRight size={16} />
                    </Link>
                    {res.harvest_id && (
                      <Link
                        href={`/harvests/${res.harvest_id}`}
                        className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition shadow-2xs"
                      >
                        Associated harvest lot
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
