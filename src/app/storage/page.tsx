'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, LocateFixed, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import type { DemoFacility } from '@/demo/storage';

export default function StorageDiscoveryPage() {
  const [facilities, setFacilities] = useState<DemoFacility[]>([]);
  const [crop, setCrop] = useState('Tomatoes');
  const [locality, setLocality] = useState('');
  const [storageType, setStorageType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/facilities')
      .then((response) => response.json())
      .then((data) => setFacilities(data.facilities ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => facilities.filter((facility) => {
    const cropMatch = facility.acceptedCommodities.some((item) => item.toLowerCase().includes(crop.toLowerCase()));
    const localityMatch = !locality || facility.locality.toLowerCase().includes(locality.toLowerCase()) || facility.county.toLowerCase().includes(locality.toLowerCase());
    const typeMatch = storageType === 'all' || facility.storageTypes.includes(storageType as 'cold' | 'ambient' | 'dry');
    return cropMatch && localityMatch && typeMatch;
  }), [facilities, crop, locality, storageType]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader eyebrow="Post-harvest support" title="Find storage near you" description="Keep your harvest safe while you plan the next move." />

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
                <option value="cold">Cold</option>
                <option value="ambient">Ambient</option>
                <option value="dry">Dry</option>
              </select>
            </label>
            <button type="button" onClick={() => navigator.geolocation?.getCurrentPosition(() => setLocality('Kisii'))} className="mt-[21px] flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-4 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs transition">
              <LocateFixed size={17} className="text-[#FF5A1F]" /> Use location
            </button>
          </div>
        </section>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600">Certified Regional Facilities</p>
            <h2 className="mt-1 text-xl font-bold text-[#17191D]">Suitable places for {crop || 'your produce'}</h2>
          </div>
          <button type="button" className="flex h-10 items-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-3 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs">
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {loading ? (
          <div className="mt-5 h-52 animate-pulse rounded-2xl bg-[#E2DED6]/40" />
        ) : filtered.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#E2DED6] bg-white p-8 text-center">
            <h3 className="font-bold text-[#17191D]">No matching facility found</h3>
            <p className="mt-2 text-sm text-[#74767B]">Try another crop, county or storage type.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {filtered.map((facility) => (
              <article key={facility.id} className="overflow-hidden rounded-2xl border border-[#E2DED6] bg-white shadow-xs hover:border-[#FF5A1F] transition">
                <div className="relative aspect-[16/7] w-full overflow-hidden bg-[#22252A]">
                  <Image src={facility.imageUrl} alt={facility.imageAlt} fill sizes="(max-width: 1024px) 100vw, 590px" className="object-cover" />
                  <span className="absolute bottom-3 left-3 rounded-md bg-[#17191D]/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                    Illustrative image
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-[#FF5A1F]">{facility.facilityType.replace('_', ' ')}</span>
                    <h3 className="mt-2 text-xl font-bold text-[#17191D]">{facility.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[#74767B]">
                      <MapPin size={15} className="text-[#FF5A1F]" /> {facility.locality}, {facility.county}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    Verified
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#74767B]">{facility.description}</p>
                <div className="mt-5 grid grid-cols-3 border-y border-[#E2DED6] py-4 text-sm">
                  <div>
                    <p className="text-xs font-mono uppercase text-[#74767B]">Capacity</p>
                    <p className="mt-1 font-bold text-[#17191D] font-mono">{facility.availableCapacityKg.toLocaleString()} kg</p>
                  </div>
                  <div className="border-x border-[#E2DED6] px-3">
                    <p className="text-xs font-mono uppercase text-[#74767B]">Storage Tariff</p>
                    <p className="mt-1 font-bold text-[#17191D] font-mono">KSh {facility.pricePerUnit}/{facility.priceUnit}</p>
                  </div>
                  <div className="pl-3">
                    <p className="text-xs font-mono uppercase text-[#74767B]">Condition</p>
                    <p className="mt-1 font-bold text-[#2563EB] font-mono">{facility.temperatureC}°C</p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-[#74767B]">
                  Accepted: {facility.acceptedCommodities.join(', ')} · Telemetry logged: {new Date(facility.readingObservedAt).toLocaleString('en-KE')}
                </p>
                <div className="mt-5 flex gap-3">
                  <Link href={`/storage/${facility.id}`} className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E2DED6] bg-white text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition shadow-2xs">
                    View facility
                  </Link>
                  <Link href={`/storage/${facility.id}/request`} className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] text-sm font-bold text-white shadow-sm transition active:scale-98">
                    Reserve storage <ArrowRight size={16} />
                  </Link>
                </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
