'use client';

import Link from 'next/link';
import { ArrowRight, LocateFixed, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
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

        <section className="mt-7 border border-[#004A25]/10 bg-white p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_.7fr_auto]">
            <label className="grid gap-1.5 text-xs font-bold text-[#3E594B]">County or locality<div className="flex h-11 items-center gap-2 border border-[#004A25]/15 px-3"><MapPin size={17} /><input value={locality} onChange={(event) => setLocality(event.target.value)} placeholder="Kisii or Nyamira" className="min-w-0 flex-1 text-sm outline-none" /></div></label>
            <label className="grid gap-1.5 text-xs font-bold text-[#3E594B]">Produce<div className="flex h-11 items-center gap-2 border border-[#004A25]/15 px-3"><Search size={17} /><input value={crop} onChange={(event) => setCrop(event.target.value)} placeholder="Tomatoes" className="min-w-0 flex-1 text-sm outline-none" /></div></label>
            <label className="grid gap-1.5 text-xs font-bold text-[#3E594B]">Storage type<select value={storageType} onChange={(event) => setStorageType(event.target.value)} className="h-11 border border-[#004A25]/15 bg-white px-3 text-sm"><option value="all">All types</option><option value="cold">Cold</option><option value="ambient">Ambient</option><option value="dry">Dry</option></select></label>
            <button type="button" onClick={() => navigator.geolocation?.getCurrentPosition(() => setLocality('Kisii'))} className="mt-[21px] flex h-11 items-center justify-center gap-2 border border-[#004A25]/15 px-4 text-sm font-bold"><LocateFixed size={17} /> Use location</button>
          </div>
        </section>

        <div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase text-[#3E594B]">Demo facilities</p><h2 className="mt-1 text-xl font-bold">Suitable places for {crop || 'your produce'}</h2></div><button type="button" className="flex h-10 items-center gap-2 border border-[#004A25]/15 px-3 text-sm font-bold"><SlidersHorizontal size={16} /> Filters</button></div>

        {loading ? <div className="mt-5 h-52 animate-pulse bg-[#EDF5DF]" /> : filtered.length === 0 ? <div className="mt-5 border border-dashed border-[#004A25]/20 p-8 text-center"><h3 className="font-bold">No matching demo facility</h3><p className="mt-2 text-sm text-[#3E594B]">Try another crop, county or storage type.</p></div> : <div className="mt-5 grid gap-5 lg:grid-cols-2">{filtered.map((facility) => (
          <article key={facility.id} className="border border-[#004A25]/10 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold uppercase text-[#76AC3C]">Demo · {facility.facilityType.replace('_', ' ')}</span><h3 className="mt-2 text-xl font-bold">{facility.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-[#3E594B]"><MapPin size={15} /> {facility.locality}, {facility.county}</p></div><span className="rounded-full border border-[#004A25]/15 px-2 py-1 text-[10px] font-bold">Unverified</span></div>
            <p className="mt-4 text-sm leading-6 text-[#3E594B]">{facility.description}</p>
            <div className="mt-5 grid grid-cols-3 border-y border-[#004A25]/10 py-4 text-sm"><div><p className="text-xs text-[#3E594B]">Capacity</p><p className="mt-1 font-bold">{facility.availableCapacityKg.toLocaleString()} kg</p></div><div className="border-x border-[#004A25]/10 px-3"><p className="text-xs text-[#3E594B]">Demo price</p><p className="mt-1 font-bold">KSh {facility.pricePerUnit}/{facility.priceUnit}/{facility.pricePeriod}</p></div><div className="pl-3"><p className="text-xs text-[#3E594B]">Condition</p><p className="mt-1 font-bold">{facility.temperatureC}°C</p></div></div>
            <p className="mt-4 text-xs leading-5 text-[#3E594B]">Accepted: {facility.acceptedCommodities.join(', ')} · Reading: {new Date(facility.readingObservedAt).toLocaleString('en-KE')}</p>
            <div className="mt-5 flex gap-3"><Link href={`/storage/${facility.id}`} className="flex h-11 flex-1 items-center justify-center border border-[#004A25]/15 text-sm font-bold">View facility</Link><Link href={`/storage/${facility.id}/request`} className="flex h-11 flex-1 items-center justify-center gap-1 rounded-lg bg-[#F2C303] text-sm font-bold text-[#004A25]">Request storage <ArrowRight size={16} /></Link></div>
          </article>
        ))}</div>}
        <div className="mt-6"><DemoNotice>Fictional facilities and conditions for demonstration. Distances and locations are not live or verified.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
