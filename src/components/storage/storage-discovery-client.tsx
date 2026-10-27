'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import type { CertifiedFacility } from '@/data/facilities';
import { detectCurrentLocation } from '@/lib/geo';

function normalizeFacility(raw: Record<string, unknown>): CertifiedFacility {
  const type = ((raw.facilityType || raw.facility_type || raw.type || 'cold_storage') as string) as 'cold_storage' | 'ambient' | 'drying';
  const accepted = (raw.acceptedCommodities || raw.accepted_commodities || ['Tomatoes', 'Avocados', 'Bananas']) as string[];
  const storageTypes = (raw.storageTypes || raw.storage_types || [type === 'cold_storage' ? 'cold' : type === 'drying' ? 'dry' : 'ambient']) as Array<'cold' | 'ambient' | 'dry'>;
  const availableKg = raw.availableCapacityKg != null 
    ? Number(raw.availableCapacityKg) 
    : (type === 'cold_storage' ? 840 : type === 'drying' ? 1200 : 460);
  const price = raw.pricePerUnit != null ? Number(raw.pricePerUnit) : (raw.price_per_unit != null ? Number(raw.price_per_unit) : 3.2);

  return {
    id: String(raw.id),
    name: String(raw.name),
    locality: String(raw.locality || raw.location || 'Kisii Town'),
    county: (raw.county || 'Kisii') as 'Kisii' | 'Nyamira',
    facilityType: type,
    storageTypes: Array.isArray(storageTypes) ? storageTypes : ['cold'],
    acceptedCommodities: Array.isArray(accepted) ? accepted : ['Tomatoes'],
    description: String(raw.description || 'Certified regional agricultural storage node.'),
    availableCapacityKg: availableKg,
    pricePerUnit: price,
    priceUnit: (raw.priceUnit || raw.price_unit || 'kg') as 'kg',
    pricePeriod: (raw.pricePeriod || raw.price_period || 'day') as 'day',
    temperatureC: raw.temperatureC != null ? Number(raw.temperatureC) : (type === 'cold_storage' ? 11.8 : type === 'drying' ? 24.2 : 21.4),
    humidityPercent: raw.humidityPercent != null ? Number(raw.humidityPercent) : (type === 'cold_storage' ? 82 : type === 'drying' ? 56 : 68),
    readingObservedAt: String(raw.readingObservedAt || raw.created_at || new Date().toISOString()),
    imageUrl: String(raw.imageUrl || (type === 'cold_storage' ? '/storage/cold-store.jpg' : type === 'drying' ? '/storage/dry-handling.jpg' : '/storage/ambient-store.jpg')),
    imageAlt: String(raw.imageAlt || `${String(raw.name)} facility`),
    source: (raw.source as CertifiedFacility['source']) || (raw.is_demo ? 'demo_data' : 'provider_confirmed'),
    verificationStatus: (raw.verificationStatus || raw.verification_status || 'verified') as 'verified' | 'unverified',
  };
}

export function StorageDiscoveryClient() {
  const searchParams = useSearchParams();
  const harvestId = searchParams.get('harvestId') || '';
  const initialCrop = searchParams.get('crop') || '';
  const initialQuantity = searchParams.get('quantity') || '';
  const initialType = searchParams.get('type') || 'all';

  const [facilities, setFacilities] = useState<CertifiedFacility[]>([]);
  const [crop, setCrop] = useState(initialCrop || 'Tomatoes');
  const [locality, setLocality] = useState('');
  const [storageType, setStorageType] = useState(initialType);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState('');

  const handleLocate = async () => {
    setLocating(true);
    setGeoFeedback('');
    try {
      const res = await detectCurrentLocation();
      setLocality(res.county);
      setGeoFeedback(`Located in ${res.county}`);
    } catch (err) {
      setGeoFeedback(err instanceof Error ? err.message : 'Could not detect location');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    fetch('/api/facilities')
      .then((response) => response.json())
      .then((data) => {
        const rawList = Array.isArray(data.facilities) ? data.facilities : [];
        setFacilities(rawList.map(normalizeFacility));
      })
      .catch(() => setFacilities([]))
      .finally(() => setLoading(false));
  }, []);

  const parsedQuantity = Number(initialQuantity) || 0;

  const filtered = useMemo(() => facilities.filter((facility) => {
    const commodities = Array.isArray(facility.acceptedCommodities) ? facility.acceptedCommodities : [];
    const cropMatch = !crop || commodities.some((item) => typeof item === 'string' && item.toLowerCase().includes(crop.toLowerCase()));
    const loc = facility.locality || '';
    const cnty = facility.county || '';
    const localityMatch = !locality || loc.toLowerCase().includes(locality.toLowerCase()) || cnty.toLowerCase().includes(locality.toLowerCase());
    const types = Array.isArray(facility.storageTypes) ? facility.storageTypes : [];
    const typeMatch = storageType === 'all' || types.includes(storageType as 'cold' | 'ambient' | 'dry');
    return cropMatch && localityMatch && typeMatch;
  }), [facilities, crop, locality, storageType]);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Preservation & Storage Network"
        title="Find certified regional storage"
        description="Preserve produce quality, prevent distress liquidation, and secure vetted climate-controlled capacity."
      />

      {harvestId && (
        <div className="mt-5 rounded-2xl border border-[#FF5A1F]/30 bg-[#FFF0EB]/50 p-4 sm:p-5 text-[#17191D]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FF5A1F] text-white">
                <CheckCircle2 size={18} />
              </span>
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Active Harvest Context</p>
                <p className="font-bold text-sm text-[#17191D]">
                  Planning storage for {initialCrop || crop} · {initialQuantity ? `${initialQuantity} kg` : 'Full Lot'} (Lot #{harvestId.slice(0, 8)})
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

      <section className="mt-7 rounded-2xl border border-[#E2DED6] bg-white p-5 shadow-xs">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_.7fr_auto]">
          <label className="grid gap-1.5 text-xs font-bold text-[#74767B]">
            County or locality
            <div className="flex h-11 items-center gap-2 rounded-xl border border-[#E2DED6] px-3 focus-within:border-[#FF5A1F] transition">
              <MapPin size={17} className="text-[#FF5A1F]" />
              <input value={locality} onChange={(event) => setLocality(event.target.value)} placeholder="Kisii or Nyamira" className="min-w-0 flex-1 text-sm outline-none text-[#17191D]" />
            </div>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-[#74767B]">
            Produce
            <div className="flex h-11 items-center gap-2 rounded-xl border border-[#E2DED6] px-3 focus-within:border-[#FF5A1F] transition">
              <Search size={17} className="text-[#74767B]" />
              <input value={crop} onChange={(event) => setCrop(event.target.value)} placeholder="Tomatoes" className="min-w-0 flex-1 text-sm outline-none text-[#17191D]" />
            </div>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-[#74767B]">
            Storage type
            <select value={storageType} onChange={(event) => setStorageType(event.target.value)} className="h-11 rounded-xl border border-[#E2DED6] bg-white px-3 text-sm text-[#17191D] outline-none focus:border-[#FF5A1F]">
              <option value="all">All types</option>
              <option value="cold">Cold (11–13°C)</option>
              <option value="ambient">Ambient (Ventilated)</option>
              <option value="dry">Solar Dehydration</option>
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
                  <LocateFixed size={17} className="text-[#FF5A1F]" /> Use location
                </>
              )}
            </button>
            {geoFeedback && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">{geoFeedback}</p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600">Certified Regional Facilities</p>
          <h2 className="mt-1 text-xl font-bold text-[#17191D]">Suitable facilities for {crop || 'your produce'}</h2>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 h-52 animate-pulse rounded-2xl bg-[#E2DED6]/40" />
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#E2DED6] bg-white p-8 text-center">
          <h3 className="font-bold text-[#17191D]">No matching facilities found</h3>
          <p className="mt-2 text-sm text-[#74767B]">Try another crop, county or storage type filter.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {filtered.map((facility) => {
            const hasCapacity = parsedQuantity <= 0 || facility.availableCapacityKg >= parsedQuantity;
            const acceptsSelectedCrop = !crop || facility.acceptedCommodities.some((c) => c.toLowerCase().includes(crop.toLowerCase()));
            const estimated7DayCost = parsedQuantity > 0 ? parsedQuantity * facility.pricePerUnit * 7 : null;
            const requestQuery = harvestId
              ? `?harvestId=${harvestId}&quantity=${initialQuantity || ''}&crop=${encodeURIComponent(crop)}`
              : '';

            return (
              <article key={facility.id} className="overflow-hidden rounded-2xl border border-[#E2DED6] bg-white shadow-xs hover:border-[#FF5A1F] transition flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/7] w-full overflow-hidden bg-[#22252A]">
                    <Image src={facility.imageUrl} alt={facility.imageAlt} fill sizes="(max-width: 1024px) 100vw, 590px" className="object-cover" />
                    <span className="absolute bottom-3 left-3 rounded-md bg-[#17191D]/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                      {facility.facilityType === 'cold_storage' ? 'Certified Cold Room' : facility.facilityType === 'drying' ? 'Dehydration Hub' : 'Ventilated Store'}
                    </span>
                    {facility.verificationStatus === 'verified' ? (
                      <span className="absolute top-3 right-3 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur">
                        Verified Facility
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 rounded-md bg-amber-600/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur">
                        Unverified
                      </span>
                    )}
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">{facility.facilityType.replace('_', ' ')}</span>
                        <h3 className="mt-1.5 text-xl font-bold text-[#17191D]">{facility.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-[#74767B]">
                          <MapPin size={15} className="text-[#FF5A1F]" /> {facility.locality}, {facility.county} County
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#74767B]">{facility.description}</p>

                    <div className="mt-5 grid grid-cols-3 border-y border-[#E2DED6] py-3.5 text-sm">
                      <div>
                        <p className="text-xs font-mono uppercase text-[#74767B]">Headroom</p>
                        <p className={`mt-1 font-bold font-mono ${hasCapacity ? 'text-[#17191D]' : 'text-red-600'}`}>
                          {facility.availableCapacityKg.toLocaleString()} kg
                        </p>
                      </div>
                      <div className="border-x border-[#E2DED6] px-3">
                        <p className="text-xs font-mono uppercase text-[#74767B]">Tariff</p>
                        <p className="mt-1 font-bold text-[#17191D] font-mono">KSh {facility.pricePerUnit}/{facility.priceUnit}/day</p>
                      </div>
                      <div className="pl-3">
                        <p className="text-xs font-mono uppercase text-[#74767B]">Telemetry</p>
                        <p className="mt-1 font-bold text-[#2563EB] font-mono">{facility.temperatureC}°C · {facility.humidityPercent}% RH</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-[#74767B]">Commodities:</span>
                      {facility.acceptedCommodities.map((comm) => {
                        const isMatch = crop && comm.toLowerCase().includes(crop.toLowerCase());
                        return (
                          <span
                            key={comm}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              isMatch ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-[#FAF9F5] text-[#74767B] border border-[#E2DED6]'
                            }`}
                          >
                            {comm}
                          </span>
                        );
                      })}
                      {crop && !acceptsSelectedCrop && (
                        <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                          {crop} not listed
                        </span>
                      )}
                    </div>

                    {estimated7DayCost !== null && (
                      <p className="mt-3 rounded-lg bg-[#FAF9F5] p-2.5 text-xs text-[#74767B] font-mono">
                        Estimated 7-day tariff for {parsedQuantity} kg: <strong className="text-[#17191D]">KSh {estimated7DayCost.toLocaleString()}</strong>
                      </p>
                    )}

                    <p className="mt-3 text-[11px] text-[#74767B] flex items-center gap-1.5">
                      <Clock size={13} className="text-[#74767B]" /> Telemetry verified: {new Date(facility.readingObservedAt).toLocaleString('en-KE')}
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6 pt-0">
                  <div className="mt-2 flex gap-3">
                    <Link href={`/storage/${facility.id}${requestQuery}`} className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E2DED6] bg-white text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition shadow-2xs">
                      View facility
                    </Link>
                    <Link
                      href={`/storage/${facility.id}/request${requestQuery}`}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] text-sm font-bold text-white shadow-sm transition active:scale-98"
                    >
                      Reserve storage <ArrowRight size={16} />
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
