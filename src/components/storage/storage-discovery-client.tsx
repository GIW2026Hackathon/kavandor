'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  ShieldCheck,
  Phone,
  MessageCircle,
  Building2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { regionalProviders, type ValueAdditionProvider, type ServiceType } from '@/data/providers';
import { detectCurrentLocation } from '@/lib/geo';

export function StorageDiscoveryClient() {
  const searchParams = useSearchParams();
  const harvestId = searchParams.get('harvestId') || '';
  const initialCrop = searchParams.get('crop') || '';
  const initialQuantity = searchParams.get('quantity') || '';
  const initialType = (searchParams.get('type') || 'all') as string;

  const [providers, setProviders] = useState<ValueAdditionProvider[]>(regionalProviders);
  const [crop, setCrop] = useState(initialCrop || 'Tomatoes');
  const [locality, setLocality] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>(initialType);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState('');

  const handleLocate = async () => {
    setLocating(true);
    setGeoFeedback('');
    try {
      const res = await detectCurrentLocation();
      setLocality(res.county);
      setGeoFeedback(`Located near ${res.county} center`);
    } catch (err) {
      setGeoFeedback(err instanceof Error ? err.message : 'Could not detect location');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    fetch('/api/providers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.providers) && data.providers.length > 0) {
          setProviders(data.providers);
        } else {
          setProviders(regionalProviders);
        }
      })
      .catch(() => setProviders(regionalProviders))
      .finally(() => setLoading(false));
  }, []);

  const parsedQuantity = Number(initialQuantity) || 0;

  const filtered = useMemo(() => {
    return providers.filter((provider) => {
      // 1. Locality match
      const loc = provider.locality.toLowerCase();
      const cnty = provider.county.toLowerCase();
      const locTarget = locality.toLowerCase().trim();
      const localityMatch = !locTarget || loc.includes(locTarget) || cnty.includes(locTarget);

      // 2. Crop/commodity match across any service
      const cropTarget = crop.toLowerCase().trim();
      const cropMatch =
        !cropTarget ||
        provider.services.some((s) =>
          s.acceptedCommodities.some((c) => {
            const clower = c.toLowerCase();
            return clower.includes(cropTarget) || cropTarget.includes(clower);
          })
        );

      // 3. Service type filter
      const typeMatch =
        serviceFilter === 'all' ||
        provider.services.some((s) => {
          if (serviceFilter === 'cold') return s.serviceType === 'cold_storage';
          if (serviceFilter === 'ambient') return s.serviceType === 'ambient_storage';
          if (serviceFilter === 'drying') return s.serviceType === 'drying';
          if (serviceFilter === 'processing') return s.serviceType === 'processing';
          if (serviceFilter === 'cooperative') return s.serviceType === 'aggregation';
          if (serviceFilter === 'dairy_chilling') return s.serviceType === 'dairy_chilling';
          if (serviceFilter === 'packhouse') return s.serviceType === 'grading_sorting';
          return s.serviceType === serviceFilter;
        });

      return localityMatch && cropMatch && typeMatch;
    });
  }, [providers, crop, locality, serviceFilter]);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Regional Value-Addition Network"
        title="Discover Processors, Storage &amp; Aggregators"
        description="Connect your harvest directly with vetted cold rooms, puree pulping, solar dehydration, cooperative pooling, dairy chilling, and haulage in Kisii &amp; Nyamira."
      />

      {harvestId && (
        <div className="mt-5 rounded-2xl border border-[#FF5A1F]/30 bg-[#FFF0EB]/50 p-4 sm:p-5 text-[#17191D]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FF5A1F] text-white">
                <CheckCircle2 size={18} />
              </span>
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
                  Active Harvest Context
                </p>
                <p className="font-bold text-sm text-[#17191D]">
                  Finding service provider for {initialCrop || crop} · {initialQuantity ? `${initialQuantity} kg` : 'Full Lot'} (Lot #{harvestId.slice(0, 8)})
                </p>
              </div>
            </div>
            <Link
              href={`/harvests/${harvestId}/compare`}
              className="text-xs font-bold text-[#FF5A1F] hover:underline"
            >
              Revisit pathways comparison →
            </Link>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <section className="mt-7 rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_.9fr_auto]">
          <label className="grid gap-1.5 text-xs font-bold text-[#74767B]">
            County or Locality
            <div className="flex h-11 items-center gap-2 rounded-xl border border-[#E2DED6] px-3 focus-within:border-[#FF5A1F] transition">
              <MapPin size={17} className="text-[#FF5A1F]" />
              <input
                value={locality}
                onChange={(event) => setLocality(event.target.value)}
                placeholder="e.g. Kisii Town, Nyakoe, Manga"
                className="min-w-0 flex-1 text-sm outline-none text-[#17191D]"
              />
            </div>
          </label>

          <label className="grid gap-1.5 text-xs font-bold text-[#74767B]">
            Commodity / Produce
            <div className="flex h-11 items-center gap-2 rounded-xl border border-[#E2DED6] px-3 focus-within:border-[#FF5A1F] transition">
              <Search size={17} className="text-[#74767B]" />
              <input
                value={crop}
                onChange={(event) => setCrop(event.target.value)}
                placeholder="e.g. Tomatoes, Avocados, Cow milk"
                className="min-w-0 flex-1 text-sm outline-none text-[#17191D]"
              />
            </div>
          </label>

          <label className="grid gap-1.5 text-xs font-bold text-[#74767B]">
            Service / Value-Addition Type
            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              className="h-11 rounded-xl border border-[#E2DED6] bg-white px-3 text-sm text-[#17191D] outline-none focus:border-[#FF5A1F]"
            >
              <option value="all">All Regional Services</option>
              <option value="cold">Cold Storage (11–13°C)</option>
              <option value="processing">Agro-Processing &amp; Puree</option>
              <option value="cooperative">Cooperative Aggregation</option>
              <option value="drying">Solar Dehydration</option>
              <option value="dairy_chilling">Dairy Bulk Chilling</option>
              <option value="packhouse">Packhouse Grading &amp; Sizing</option>
              <option value="ambient">Ambient Ventilated Storage</option>
            </select>
          </label>

          <div className="flex flex-col">
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              className="mt-[21px] flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-4 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs transition disabled:opacity-60"
            >
              {locating ? (
                <>
                  <Loader2 size={17} className="animate-spin text-[#FF5A1F]" /> Locating…
                </>
              ) : (
                <>
                  <LocateFixed size={17} className="text-[#FF5A1F]" /> Near Me
                </>
              )}
            </button>
            {geoFeedback && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">{geoFeedback}</p>
            )}
          </div>
        </div>
      </section>

      {/* Directory Disclaimer */}
      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600">
            Regional Service Registry
          </p>
          <h2 className="mt-0.5 text-xl font-bold text-[#17191D]">
            {filtered.length} verified value-addition providers in Kisii &amp; Nyamira
          </h2>
        </div>
        <p className="text-[11px] text-[#74767B]">
          Missing tariffs or capacities are labeled explicitly. No unverified estimates.
        </p>
      </div>

      {loading ? (
        <div className="mt-5 h-52 animate-pulse rounded-2xl bg-[#E2DED6]/40" />
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#E2DED6] bg-white p-12 text-center">
          <Building2 size={40} className="mx-auto text-[#74767B]/60" />
          <h3 className="mt-4 text-lg font-bold text-[#17191D]">No matching providers found</h3>
          <p className="mt-2 text-sm text-[#74767B]">
            Try adjusting your commodity name, county filter, or service type.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {filtered.map((provider) => {
            const isVerified = provider.verificationStatus === 'verified';
            const requestQuery = harvestId
              ? `?harvestId=${harvestId}&quantity=${initialQuantity || ''}&crop=${encodeURIComponent(crop)}`
              : '';

            return (
              <article
                key={provider.id}
                className="overflow-hidden rounded-2xl border border-[#E2DED6] bg-white shadow-xs hover:border-[#FF5A1F] transition flex flex-col justify-between"
              >
                <div>
                  {/* Image & Verified Header */}
                  <div className="relative aspect-[16/7] w-full overflow-hidden bg-[#22252A]">
                    <Image
                      src={provider.imageUrl}
                      alt={provider.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 590px"
                      className="object-cover"
                    />
                    <span className="absolute bottom-3 left-3 rounded-md bg-[#17191D]/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                      {provider.providerType.replace('_', ' ')}
                    </span>
                    {isVerified ? (
                      <span className="absolute top-3 right-3 rounded-md bg-emerald-600/95 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur flex items-center gap-1">
                        <ShieldCheck size={12} /> Verified Facility
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 rounded-md bg-amber-600/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur">
                        Demo Provider
                      </span>
                    )}
                  </div>

                  <div className="p-5 sm:p-6">
                    {/* Identity & Locality */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">
                          {provider.county} County
                        </span>
                        <h3 className="mt-1 text-xl font-bold text-[#17191D]">{provider.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#74767B]">
                          <MapPin size={14} className="text-[#FF5A1F]" /> {provider.locality} · Coordinates: {provider.coordinates.lat.toFixed(4)}, {provider.coordinates.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-[#74767B]">{provider.description}</p>

                    {/* Services & Capabilities List */}
                    <div className="mt-4 space-y-2.5">
                      <p className="text-xs font-bold text-[#17191D] flex items-center gap-1.5">
                        <Layers size={13} className="text-[#FF5A1F]" /> Available Services:
                      </p>

                      <div className="space-y-2">
                        {provider.services.map((srv) => (
                          <div
                            key={srv.id}
                            className="rounded-xl border border-[#E2DED6] bg-[#FAF9F5] p-3 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-[#17191D]">{srv.name}</span>
                              <span className="font-mono font-bold text-[#FF5A1F]">
                                {srv.pricing.amount !== undefined
                                  ? `KSh ${srv.pricing.amount}/${srv.pricing.unit || 'kg'}`
                                  : 'Quote required'}
                              </span>
                            </div>

                            <p className="mt-1 text-[11px] text-[#74767B]">{srv.description}</p>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="font-semibold text-neutral-600">Commodities:</span>
                              {srv.acceptedCommodities.map((c) => (
                                <span
                                  key={c}
                                  className="rounded bg-white border border-[#E2DED6] px-1.5 py-0.5 text-neutral-800"
                                >
                                  {c}
                                </span>
                              ))}
                              {srv.capacity.available !== undefined && (
                                <span className="ml-auto font-mono text-[#008765] font-semibold">
                                  Capacity: {srv.capacity.available.toLocaleString()} {srv.capacity.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Audited Verification Evidence */}
                    <div className="mt-4 rounded-lg bg-emerald-50/70 border border-emerald-200 p-2.5 text-[11px] text-emerald-900">
                      <span className="font-bold">Verification Evidence:</span> {provider.verificationEvidence}
                    </div>

                    {/* Telemetry / Operating Hours */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#74767B]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {provider.operatingHours || 'Mon–Sat: 07:00 – 18:00'}
                      </span>
                      <span className="font-mono">Data Source: {provider.dataSource.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-5 sm:p-6 pt-0 border-t border-[#E2DED6]/60">
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`tel:${provider.contactPhone}`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#E2DED6] bg-white px-3 text-xs font-semibold text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs"
                    >
                      <Phone size={13} className="text-[#008765]" /> Call
                    </a>
                    <a
                      href={`https://wa.me/${provider.contactWhatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(provider.name)},%20I%20am%20inquiring%20about%20service%20availability%20via%20KAVANDOR`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#E2DED6] bg-white px-3 text-xs font-semibold text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs"
                    >
                      <MessageCircle size={13} className="text-[#008765]" /> WhatsApp
                    </a>

                    <Link
                      href={`/storage/${provider.id}/request${requestQuery}`}
                      className="ml-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-4 text-xs font-bold text-white shadow-xs transition active:scale-98"
                    >
                      Request Service / Quote <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
