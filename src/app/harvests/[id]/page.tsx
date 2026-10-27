import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, Info, TriangleAlert, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { QuantityDisplay } from '@/components/ui/quantity-display';
import { StatusBadge, type HarvestStatus } from '@/components/ui/status-badge';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { assessHarvest } from '@/lib/ai';
import { ReAssessButton } from '@/components/harvest/reassess-button';

export const instant = false;

export default async function HarvestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let harvest: {
    id: string;
    crop: string;
    quantity: number;
    unit: string;
    harvest_date: string;
    location: string;
    handling_notes?: string | null;
    status: string;
    created_at: string;
    photo_path?: string | null;
  } | null = null;

  let photoSignedUrl: string | null = null;

  let assessment: {
    crop: string;
    confidence: number;
    observations: Array<{ label: string; detail: string; severity?: string }>;
    defects: string[];
    limitations: string[];
    provider: string;
  } | null = null;

  try {
    const client = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    const db = client || admin;

    const { data: hData } = await db.from('harvests').select('*').eq('id', id).maybeSingle();
    if (hData) {
      harvest = hData;
    } else if (admin) {
      const { data: fallbackH } = await admin.from('harvests').select('*').eq('id', id).maybeSingle();
      if (fallbackH) harvest = fallbackH;
    }

    if (harvest) {
      // Query photo if exists
      const { data: photoData } = await db
        .from('harvest_photos')
        .select('storage_path')
        .eq('harvest_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const storagePath = photoData?.storage_path || harvest.photo_path;
      if (storagePath) {
        const { data: signed } = await db.storage
          .from('harvest-photos')
          .createSignedUrl(storagePath, 3600);
        photoSignedUrl = signed?.signedUrl || null;
      }

      const { data: aData } = await db.from('assessments').select('*').eq('harvest_id', id).maybeSingle();
      if (aData) {
        assessment = aData;
      } else {
        // Run agronomic assessment with Gemini Vision
        const result = await assessHarvest({
          crop: harvest.crop,
          quantity: Number(harvest.quantity),
          unit: harvest.unit,
          location: harvest.location,
          handlingNotes: harvest.handling_notes || undefined,
          photoUrl: photoSignedUrl || undefined,
        });

        assessment = {
          crop: result.crop,
          confidence: result.confidence,
          observations: result.observations,
          defects: result.defects,
          limitations: result.limitations,
          provider: result.provider,
        };

        // Persist assessment to Supabase
        if (admin) {
          await admin.from('assessments').upsert({
            harvest_id: harvest.id,
            crop: result.crop,
            confidence: result.confidence,
            observations: result.observations,
            defects: result.defects,
            limitations: result.limitations,
            provider: result.provider,
            assessment_mode: 'provider',
          }, { onConflict: 'harvest_id' });
          await admin.from('harvests').update({ status: 'assessed' }).eq('id', harvest.id);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load harvest detail:', err);
  }

  // Graceful fallback for seed demo if ID not in DB
  if (!harvest) {
    if (id === 'KV-2026-001') {
      harvest = {
        id: 'KV-2026-001',
        crop: 'Tomatoes',
        quantity: 220,
        unit: 'kg',
        harvest_date: new Date().toISOString(),
        location: 'Nyakundi Farm · Kisii',
        handling_notes: 'Harvested at sunrise into ventilated crates and shaded.',
        status: 'assessed',
        created_at: new Date().toISOString(),
      };
      assessment = {
        crop: 'Tomatoes',
        confidence: 0.88,
        observations: [
          { label: 'Maturity & Firmness', detail: 'Uniform breaker-to-turning maturity stage; firm pulp structure' },
          { label: 'Surface Condition', detail: 'Clean skin surface with natural bloom; no split skins' },
        ],
        defects: ['Minor surface blemishes on <4% of batch; zero fungal rot detected'],
        limitations: [
          'Visible-condition assessment cannot confirm internal quality, contamination, or exact shelf life.',
          'Quality subject to digital intake weighbridge inspection at packhouse.',
        ],
        provider: 'kavandor-agronomic-engine',
      };
    } else {
      notFound();
    }
  }

  const dateStr = new Date(harvest.harvest_date).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <Link
          href="/harvests"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#74767B] hover:text-[#17191D] transition-colors"
        >
          <ArrowLeft size={16} /> All harvests
        </Link>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
              Lot #{harvest.id.slice(0, 13)} · Harvested {dateStr}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">
              {harvest.crop} Harvest Intelligence
            </h1>
            <p className="mt-1 text-sm text-[#74767B]">{harvest.location}</p>
          </div>
          <StatusBadge status={harvest.status as HarvestStatus} />
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
          {/* Produce Visual Preview & Batch Stamp */}
          <div className="relative min-h-72 overflow-hidden rounded-2xl bg-[#17191D] border border-[#22252A] shadow-md flex flex-col justify-end p-5">
            {photoSignedUrl ? (
              <>
                <Image
                  src={photoSignedUrl}
                  alt={harvest.crop}
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <span className="absolute top-3 left-3 rounded-md bg-[#17191D]/85 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                  Analyzed Produce Photo
                </span>
              </>
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,.15)_0_8%,transparent_9%),linear-gradient(135deg,rgba(255,255,255,.05),rgba(0,0,0,.4))]" />
            )}
            <div className="relative z-10 rounded-xl border border-white/10 bg-[#17191D]/90 p-4 text-white backdrop-blur-md">
              <p className="text-xs font-mono uppercase text-[#FF5A1F]">
                Declared Farmgate Load
              </p>
              <QuantityDisplay quantity={Number(harvest.quantity)} unit={harvest.unit} />
              {harvest.handling_notes && (
                <p className="mt-2 text-xs text-neutral-300 border-t border-white/10 pt-2 line-clamp-2">
                  Handling: {harvest.handling_notes}
                </p>
              )}
            </div>
          </div>

          {/* Condition Appraisal & Defect Analysis */}
          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
                  Condition Appraisal &amp; Agronomic Triage
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#17191D]">
                  Grade: {assessment?.confidence && assessment.confidence > 0.8 ? 'A-Standard' : 'Commercial Grade'}
                </h2>
                <p className="mt-1 text-xs text-[#74767B]">
                  Provider: <span className="font-mono font-semibold text-[#17191D]">{assessment?.provider || 'kavandor-agronomic-engine'}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  Confidence ({assessment ? Math.round(assessment.confidence * 100) : 85}%)
                </span>
                <ReAssessButton harvestId={harvest.id} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {assessment?.observations?.map((obs, idx) => (
                <div key={idx} className="border-t border-[#E2DED6] pt-4">
                  <Eye size={18} className="text-[#FF5A1F]" />
                  <p className="mt-2 text-sm font-bold text-[#17191D]">{obs.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[#74767B]">{obs.detail}</p>
                </div>
              )) || (
                <>
                  <div className="border-t border-[#E2DED6] pt-4">
                    <Eye size={18} className="text-[#FF5A1F]" />
                    <p className="mt-2 text-sm font-bold text-[#17191D]">Maturity Check</p>
                    <p className="mt-1 text-sm leading-6 text-[#74767B]">Good commercial firmness, uniform harvesting.</p>
                  </div>
                  <div className="border-t border-[#E2DED6] pt-4">
                    <TriangleAlert size={18} className="text-[#FF5A1F]" />
                    <p className="mt-2 text-sm font-bold text-[#17191D]">Visible Defects</p>
                    <p className="mt-1 text-sm leading-6 text-[#74767B]">Low defect incidence; subject to weighbridge intake confirmation.</p>
                  </div>
                </>
              )}
            </div>

            {/* Explicit Uncertainty & Limitations Disclosure */}
            {assessment?.limitations && assessment.limitations.length > 0 && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <Info size={14} className="text-amber-700" /> Agronomic Assessment Limitations:
                </p>
                <ul className="mt-1.5 list-disc list-inside space-y-1 text-amber-800">
                  {assessment.limitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* Actionable Next Move Banner */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.7fr]">
          <section className="rounded-2xl border border-[#00C896]/30 border-l-4 border-l-[#00C896] bg-[#E6F9F4] p-5 sm:p-6">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#008765]">
              Actionable Post-Harvest Decision
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#17191D]">
              Compare preservation and selling pathways
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#008765]">
              Model net returns across immediate local wholesale liquidation, cold room preservation holding, and suitable solar drying options.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/harvests/${harvest.id}/compare`}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-5 text-sm font-bold text-white shadow-sm transition active:scale-98"
              >
                Compare options <ArrowRight size={17} />
              </Link>
              <Link
                href={`/storage?harvestId=${harvest.id}&crop=${harvest.crop}&quantity=${harvest.quantity}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition shadow-2xs"
              >
                Find certified cold storage
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <ShieldCheck size={20} className="text-emerald-600" />
              <h2 className="font-bold text-[#17191D]">Intake Verification Gate</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#74767B]">
              Field appraisal provides immediate decision intelligence. Final batch weight and grade are officially certified by the packhouse electronic scale upon arrival.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
