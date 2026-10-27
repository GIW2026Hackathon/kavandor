import Link from 'next/link';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { resolveAuthContext } from '@/lib/auth-server';
import { ProviderResponseWidget } from '@/components/storage/provider-response-widget';

export const instant = false;

interface ReservationDetail {
  id: string;
  harvest_id: string;
  facility_id: string;
  farmer_id?: string;
  quantity_kg: number;
  requested_start_at: string;
  expected_end_at: string;
  status: string;
  service_type?: string;
  quote_amount?: number | null;
  quote_notes?: string | null;
  provider_notes?: string | null;
  created_at: string;
  harvests: {
    id: string;
    crop: string;
    quantity: number;
    unit: string;
    location?: string;
    handling_notes?: string;
  } | null;
  facilities: {
    id: string;
    name: string;
    location: string;
    county: string;
    price_per_unit: number;
    type?: string;
  } | null;
}

interface TransportJobDetail {
  id: string;
  status: string;
}

export default async function StorageRequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  await connection();
  const { requestId } = await params;
  const admin = createSupabaseAdminClient();
  const auth = await resolveAuthContext();

  let reservation: ReservationDetail | null = null;
  let transportJob: TransportJobDetail | null = null;

  if (admin) {
    try {
      const { data } = await admin
        .from('reservations')
        .select(`
          id,
          harvest_id,
          facility_id,
          farmer_id,
          quantity_kg,
          requested_start_at,
          expected_end_at,
          status,
          service_type,
          quote_amount,
          quote_notes,
          provider_notes,
          created_at,
          harvests (id, crop, quantity, unit, location, handling_notes),
          facilities (id, name, location, county, price_per_unit, type)
        `)
        .eq('id', requestId)
        .maybeSingle();

      if (data) {
        reservation = data as unknown as ReservationDetail;
        // Check for linked transport job
        const { data: job } = await admin
          .from('transport_jobs')
          .select('id, status')
          .or(`storage_request_id.eq.${requestId},harvest_id.eq.${data.harvest_id}`)
          .maybeSingle();
        transportJob = job as TransportJobDetail | null;
      }
    } catch (err) {
      console.error('Error fetching reservation detail:', err);
    }
  }

  // Graceful fallback for demo seed id
  if (!reservation) {
    if (requestId === 'RES-2026-001') {
      reservation = {
        id: 'RES-2026-001',
        harvest_id: 'KV-2026-001',
        facility_id: 'f0000001-0000-0000-0000-000000000001',
        quantity_kg: 220,
        requested_start_at: new Date().toISOString(),
        expected_end_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'confirmed',
        service_type: 'cold_storage',
        quote_amount: 4928,
        provider_notes: 'Cold room pallet bay 3 allocated. Digital intake scale ready.',
        created_at: new Date().toISOString(),
        harvests: {
          id: 'KV-2026-001',
          crop: 'Tomatoes',
          quantity: 220,
          unit: 'kg',
          location: 'Nyakundi Farm · Kisii',
          handling_notes: 'Sunrise harvest into ventilated crates',
        },
        facilities: {
          id: 'f0000001-0000-0000-0000-000000000001',
          name: 'Kisii Central Cold Store Hub',
          location: 'Kisii Town',
          county: 'Kisii',
          price_per_unit: 3.2,
          type: 'cold_storage',
        },
      };
    } else {
      notFound();
    }
  }

  const harvest = reservation.harvests;
  const facility = reservation.facilities;

  const durationDays = Math.max(
    1,
    Math.round(
      (new Date(reservation.expected_end_at).getTime() - new Date(reservation.requested_start_at).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const tariffPerDay = facility?.price_per_unit || 3.2;
  const totalTariffEstimate = Math.round(reservation.quantity_kg * tariffPerDay * durationDays);

  return (
    <AppShell allowedRoles={['farmer', 'facility_operator', 'operations_admin']}>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <Link
          href="/storage/requests"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#74767B] hover:text-[#17191D] transition"
        >
          <ArrowLeft size={16} /> All service requests
        </Link>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase text-emerald-600">
              {reservation.status === 'confirmed' ? 'Capacity Confirmed & Allocated' : reservation.status}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">
              Service Request #{reservation.id.slice(0, 8)}
            </h1>
          </div>
          <span className="self-start rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            {reservation.status.toUpperCase()}
          </span>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#17191D]">
                  {harvest?.crop || 'Crop'} · {reservation.quantity_kg} kg
                </h2>
                <span className="text-xs font-mono font-bold text-[#FF5A1F]">
                  Lot #{reservation.harvest_id?.slice(0, 8)}
                </span>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <Row label="Service Type" value={(reservation.service_type || 'Cold Storage').replace('_', ' ').toUpperCase()} />
                <Row label="Provider Node" value={facility?.name || 'Regional Value-Addition Hub'} />
                <Row
                  label="Arrival Window"
                  value={new Date(reservation.requested_start_at).toLocaleString('en-KE', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
                <Row label="Service Duration" value={`${durationDays} Days window`} />
                <Row
                  label="Tariff Estimate"
                  value={`KSh ${totalTariffEstimate.toLocaleString()} (KSh ${tariffPerDay}/kg/day)`}
                />
                <Row
                  label="Transport"
                  value={
                    transportJob
                      ? `KAVANDOR Dispatch #${transportJob.id.slice(0, 8)} (${transportJob.status})`
                      : 'Direct Farmgate Self-Delivery'
                  }
                />
              </div>

              <p className="mt-6 rounded-xl border border-[#E2DED6] border-l-4 border-l-emerald-500 bg-[#FAF9F5] p-4 text-sm leading-6 text-[#74767B]">
                Capacity and service bookings are governed by atomic ledger rules. Digital intake weighbridge tare calibration and physical condition sign-off will occur upon gate arrival.
              </p>
            </section>

            {/* Provider Response & Quoting Widget */}
            <ProviderResponseWidget
              requestId={reservation.id}
              initialStatus={reservation.status}
              initialQuoteAmount={reservation.quote_amount}
              initialQuoteNotes={reservation.quote_notes}
              initialProviderNotes={reservation.provider_notes}
              userRole={auth.role}
            />
          </div>

          <aside className="h-fit rounded-2xl border border-[#22252A] bg-[#17191D] p-6 text-white shadow-md">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Intake Verification</p>
            <h2 className="mt-3 text-xl font-bold">Awaiting Gate Weigh-In</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Facility reception active. Digital weighbridge scale calibrated for batch intake.
            </p>

            {transportJob && (
              <Link
                href={`/transport/requests/${transportJob.id}`}
                className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-bold text-[#FF5A1F] hover:text-[#FF7A45]"
              >
                Track transit job <ArrowRight size={17} />
              </Link>
            )}

            {reservation.harvest_id && (
              <Link
                href={`/harvests/${reservation.harvest_id}`}
                className="mt-3 flex items-center justify-between text-xs text-white/60 hover:text-white"
              >
                View original harvest lot →
              </Link>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-[#E2DED6] pb-3 last:border-b-0 last:pb-0">
      <dt className="text-[#74767B]">{label}</dt>
      <dd className="text-right font-semibold text-[#17191D] font-mono">{value}</dd>
    </div>
  );
}
