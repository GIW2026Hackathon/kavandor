'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, BellRing, Boxes, PackageOpen, SlidersHorizontal, Warehouse } from 'lucide-react';
import { FacilityCard } from '@/components/facilities/facility-card';
import { FacilityComparison } from '@/components/facilities/facility-comparison';
import { FacilityDetails } from '@/components/facilities/facility-details';
import { FarmerFacilitySectionContent, type FarmerFacilitySection } from '@/components/facilities/farmer-facility-sections';
import { FacilitySearchForm } from '@/components/facilities/facility-search-form';
import { DemoNotice } from '@/components/layout/app-shell-client';
import { estimateServiceCost, facilityMatchesOutcome, getMatchingSlot, matchesFacilityCategory, normalizeCommodity, type FacilityCategory } from '@/lib/facility-discovery';
import { FacilitySchema, type Facility } from '@/types/facility';

const categoryOptions: Array<{ value: FacilityCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All service types' },
  { value: 'cold-storage', label: 'Cold storage' },
  { value: 'warehouse', label: 'Warehouses' },
  { value: 'silo', label: 'Silos' },
  { value: 'drying', label: 'Drying centres' },
  { value: 'milling', label: 'Mills' },
  { value: 'processing', label: 'Processing plants' },
  { value: 'aggregation', label: 'Aggregation hubs' },
  { value: 'grading-packaging', label: 'Grading & packaging' },
  { value: 'other', label: 'Other facilities' },
];

export function FacilityDiscovery({ initialSection = 'discover' }: { initialSection?: FarmerFacilitySection }) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [crop, setCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [county, setCounty] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [condition, setCondition] = useState('');
  const [outcome, setOutcome] = useState('preserve');
  const [serviceStart, setServiceStart] = useState('');
  const [durationDays, setDurationDays] = useState('1');
  const [category, setCategory] = useState<FacilityCategory | 'all'>('all');
  const [sort, setSort] = useState<'relevance' | 'availability' | 'cost'>('relevance');
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [activeSection, setActiveSection] = useState<FarmerFacilitySection>(initialSection);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch('/api/facilities?limit=100', { signal: controller.signal });
        const body = await response.json() as { facilities?: unknown; error?: { message?: string } };
        if (!response.ok) throw new Error(body.error?.message ?? 'Facility records could not be loaded.');
        const parsed = FacilitySchema.array().safeParse(body.facilities);
        if (!parsed.success) throw new Error('Facility records were returned in an unsupported format.');
        const facilityId = new URLSearchParams(window.location.search).get('facilityId');
        setSelectedFacilityId(parsed.data.some((facility) => facility.id === facilityId) ? facilityId ?? '' : '');
        setFacilities(parsed.data);
      } catch (reason) {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setLoadError(reason instanceof Error ? reason.message : 'Facility records could not be loaded.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [reloadCount]);

  const quantityKg = Number(quantity);
  const days = Number(durationDays);
  const filtered = useMemo(() => {
    const cropQuery = normalizeCommodity(crop);
    const countyQuery = county.trim().toLowerCase();
    return facilities.filter((facility) => {
      const cropMatches = !cropQuery || facility.acceptedCommodities.some((accepted) =>
        normalizeCommodity(accepted) === cropQuery,
      );
      const locationMatches = !countyQuery || facility.county.toLowerCase().includes(countyQuery);
      const categoryMatches = matchesFacilityCategory(facility, category);
      const hasSlot = getMatchingSlot(facility, serviceStart, days, quantityKg, harvestDate) !== null;
      return cropMatches && locationMatches && categoryMatches && (!availabilityOnly || hasSlot);
    }).sort((a, b) => {
      if (sort === 'availability') {
        return Number(getMatchingSlot(b, serviceStart, days, quantityKg, harvestDate) !== null) -
          Number(getMatchingSlot(a, serviceStart, days, quantityKg, harvestDate) !== null);
      }
      if (sort === 'cost') {
        const aCost = estimateServiceCost(a, quantityKg, days);
        const bCost = estimateServiceCost(b, quantityKg, days);
        if (aCost === null) return bCost === null ? 0 : 1;
        if (bCost === null) return -1;
        return aCost - bCost;
      }
      const aCrop = a.acceptedCommodities.some((item) => normalizeCommodity(item) === cropQuery);
      const bCrop = b.acceptedCommodities.some((item) => normalizeCommodity(item) === cropQuery);
      return Number(facilityMatchesOutcome(b, outcome)) - Number(facilityMatchesOutcome(a, outcome)) ||
        Number(bCrop) - Number(aCrop) || a.name.localeCompare(b.name);
    });
  }, [availabilityOnly, category, county, crop, days, facilities, harvestDate, outcome, quantityKg, serviceStart, sort]);

  const selectedFacility = facilities.find((facility) => facility.id === selectedFacilityId) ?? null;
  const compared = facilities.filter((facility) => comparedIds.includes(facility.id));
  const toggleComparison = (id: string) => {
    setComparedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : current);
  };

  const filteredCountLabel = `${filtered.length} ${filtered.length === 1 ? 'facility' : 'facilities'}`;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="rounded-2xl bg-[#17191D] p-5 text-white shadow-md sm:p-8">
        <p className="text-xs font-mono font-bold uppercase tracking-[.16em] text-[#FF7A45]">Farmer workspace · Infrastructure discovery</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">Agri-Value Chain Facilities</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Find a suitable next step for your harvest—from preservation and drying to processing, grading or aggregation.
            </p>
          </div>
          <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75">
            Compare what providers report, what is still unknown, and the practical benefit each service may offer.
          </p>
        </div>
      </header>

      <nav className="mt-5 overflow-x-auto" aria-label="Agri-Value Chain Facilities sections">
        <div className="flex min-w-max gap-2 border-b border-[#E2DED6]" role="tablist">
          {([
            { id: 'discover', label: 'Discover facilities', icon: Warehouse },
            { id: 'requests', label: 'Facility requests', icon: PackageOpen },
            { id: 'inventory', label: 'My stored produce', icon: Boxes },
            { id: 'alerts', label: 'Storage alerts', icon: BellRing },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`facility-tab-${id}`}
              aria-selected={activeSection === id}
              aria-controls="facility-section-panel"
              onClick={() => {
                setActiveSection(id);
                setSelectedFacilityId('');
              }}
              className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-4 text-sm font-bold transition ${
                activeSection === id
                  ? 'border-[#FF5A1F] text-[#17191D]'
                  : 'border-transparent text-[#74767B] hover:text-[#17191D]'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div id="facility-section-panel" role="tabpanel" aria-labelledby={`facility-tab-${activeSection}`} tabIndex={0}>
      {activeSection === 'discover' ? (
        <>
      <ol className="mt-5 grid gap-2 text-xs font-bold sm:grid-cols-3" aria-label="Facility request steps">
        <Step number="1" label="Enter harvest details" active />
        <Step number="2" label="Review a suitable facility" active={Boolean(selectedFacility)} />
        <Step number="3" label="Request service" active={Boolean(selectedFacility)} />
      </ol>

      <FacilitySearchForm
        crop={crop} setCrop={setCrop}
        quantity={quantity} setQuantity={setQuantity}
        location={location} setLocation={setLocation}
        county={county} setCounty={setCounty}
        harvestDate={harvestDate} setHarvestDate={setHarvestDate}
        condition={condition} setCondition={setCondition}
        outcome={outcome} setOutcome={setOutcome}
        durationDays={durationDays} setDurationDays={setDurationDays}
        serviceStart={serviceStart} setServiceStart={setServiceStart}
      />

      {!selectedFacility && (
        <>
        <section className="mt-7" aria-labelledby="results-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Provider records</p>
            <h2 id="results-title" className="mt-1 text-xl font-bold text-[#17191D]">
              {crop.trim() ? `Options for ${crop.trim()}` : 'Explore available service types'}
            </h2>
            <p className="mt-1 text-sm text-[#74767B]">{loading ? 'Loading facility records…' : `${filteredCountLabel} · compare services and known costs`}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(175px,1fr)_minmax(165px,1fr)]">
            <label className="flex h-11 items-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-3 text-xs font-semibold text-[#74767B]">
              <SlidersHorizontal size={16} className="shrink-0 text-[#FF5A1F]" />
              <select aria-label="Filter by service type" value={category} onChange={(event) => setCategory(event.target.value as FacilityCategory | 'all')} className="min-w-0 flex-1 bg-transparent text-sm text-[#17191D] outline-none">
                {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="flex h-11 items-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-3">
              <ArrowDownUp size={16} className="shrink-0 text-[#FF5A1F]" />
              <select aria-label="Sort facilities" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#17191D] outline-none">
                <option value="relevance">Sort: crop match</option>
                <option value="availability">Sort: available capacity</option>
                <option value="cost">Sort: lowest known fee</option>
              </select>
            </label>
          </div>
        </div>
        <label className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-[#17191D]">
          <input type="checkbox" checked={availabilityOnly} onChange={(event) => setAvailabilityOnly(event.target.checked)} className="size-5 accent-[#FF5A1F]" />
          Only show slots matching quantity, service start and duration
        </label>

        {loadError && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Facility records could not be loaded.</strong> {loadError}
            <button type="button" onClick={() => setReloadCount((current) => current + 1)} className="ml-3 font-bold underline">Retry</button>
          </div>
        )}
        {loading ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-2" aria-label="Loading facilities">
            {[0, 1].map((item) => <div key={item} className="h-[430px] animate-pulse rounded-2xl bg-[#E2DED6]/50" />)}
          </div>
        ) : !loadError && filtered.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#CFC9BF] bg-white p-8 text-center">
            <h3 className="font-bold text-[#17191D]">{facilities.length ? 'No matching facilities found' : 'No facility records available'}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#74767B]">
              {facilities.length
                ? 'Try another crop, location or service type. A provider must list your crop before it can be recommended.'
                : 'No facility providers are currently listed. KAVANDOR will not substitute fictional availability or prices.'}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {filtered.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                quantityKg={quantityKg}
                harvestDate={harvestDate}
                condition={condition}
                serviceStart={serviceStart}
                durationDays={days}
                recommended={facilityMatchesOutcome(facility, outcome)}
                compared={comparedIds.includes(facility.id)}
                onCompare={() => toggleComparison(facility.id)}
                onReview={() => setSelectedFacilityId(facility.id)}
              />
            ))}
          </div>
        )}
      </section>

      <FacilityComparison
        facilities={compared}
        quantityKg={quantityKg}
        durationDays={days}
        serviceStart={serviceStart}
        harvestDate={harvestDate}
        onClear={() => setComparedIds([])}
      />
        </>
      )}

      {selectedFacility && (
        <div className="mt-6" id="facility-review">
          <FacilityDetails
            facilityRecord={selectedFacility}
            harvest={{
              crop: crop.trim(),
              quantityKg,
              location,
              county,
              harvestDate,
              condition,
              intendedOutcome: outcome,
              durationDays: days,
              serviceStart,
            }}
            onBack={() => setSelectedFacilityId('')}
          />
        </div>
      )}
        </>
      ) : (
        <FarmerFacilitySectionContent
          section={activeSection}
          onDiscover={() => {
            setActiveSection('discover');
            setSelectedFacilityId('');
          }}
        />
      )}
      </div>

      <div className="mt-8">
        <DemoNotice>Facility cards use database records. Any provider-marked demonstration data is labeled; availability, fees and conditions must be reconfirmed before service.</DemoNotice>
      </div>
    </div>
  );
}

function Step({ number, label, active }: { number: string; label: string; active: boolean }) {
  return (
    <li className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 ${
      active ? 'border-[#FF5A1F] bg-[#FFF0EB] text-[#17191D]' : 'border-[#E2DED6] bg-white text-[#74767B]'
    }`}>
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-[#FF5A1F]">{number}</span>
      {label}
    </li>
  );
}
