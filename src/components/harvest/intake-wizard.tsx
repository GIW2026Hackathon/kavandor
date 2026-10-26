'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Camera, Check, ChevronLeft, ChevronRight, MapPin, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HARVEST_UNITS } from '@/types';

const steps = ['Produce', 'Harvest details', 'Location', 'Photos', 'Review'];

const produceGroups = [
  { label: 'Field crops', options: ['Maize', 'Rice', 'Wheat', 'Barley', 'Sorghum', 'Millet', 'Finger millet', 'Beans', 'Cowpeas', 'Green grams', 'Pigeon peas', 'Soybeans', 'Groundnuts', 'Sunflower', 'Cotton', 'Sugarcane', 'Tobacco'] },
  { label: 'Horticulture and fruit', options: ['Avocados', 'Bananas', 'Mangoes', 'Oranges', 'Pineapples', 'Passion fruit', 'Papayas', 'Guavas', 'Lemons', 'Tangerines', 'Watermelons', 'Melons', 'Peaches', 'Plums', 'Macadamia', 'Apples', 'Strawberries'] },
  { label: 'Vegetables and herbs', options: ['Tomatoes', 'Irish potatoes', 'Sweet potatoes', 'Cassava', 'Yams', 'Onions', 'Kale', 'Cabbages', 'Spinach', 'Carrots', 'Broccoli', 'Cauliflower', 'Capsicum', 'Cucumber', 'Eggplant', 'Garlic', 'Ginger', 'Turmeric', 'Chilies', 'Pumpkins', 'Coriander', 'Parsley', 'Basil', 'Rosemary'] },
  { label: 'Livestock', options: ['Cattle', 'Dairy cattle', 'Beef cattle', 'Goats', 'Sheep', 'Pigs', 'Camels', 'Donkeys', 'Rabbits'] },
  { label: 'Poultry', options: ['Laying hens', 'Broiler chickens', 'Ducks', 'Turkeys', 'Geese', 'Guinea fowl', 'Quail'] },
  { label: 'Dairy, eggs and apiary', options: ['Cow milk', 'Goat milk', 'Camel milk', 'Table eggs', 'Hatching eggs', 'Honey', 'Beeswax'] },
  { label: 'Aquaculture', options: ['Tilapia', 'Catfish', 'Trout', 'Prawns', 'Other fish'] },
  { label: 'Flowers and nursery', options: ['Cut roses', 'Cut flowers', 'Ornamental foliage', 'Tree seedlings', 'Fruit seedlings', 'Vegetable seedlings', 'Sod and turf'] },
  { label: 'Forestry and agroforestry', options: ['Timber', 'Firewood', 'Bamboo', 'Eucalyptus', 'Cypress', 'Tree saplings', 'Mushrooms', 'Charcoal'] },
  { label: 'Processed farm produce', options: ['Coffee beans', 'Tea leaves', 'Dried grains', 'Dried fruit', 'Vegetable oil', 'Raw hides', 'Wool', 'Hay and fodder'] },
  { label: 'Other', options: ['Other agricultural produce'] },
];

type HarvestDraft = {
  crop: string;
  customProduce: string;
  variety: string;
  quantity: string;
  unit: (typeof HARVEST_UNITS)[number];
  harvestDate: string;
  harvestTime: string;
  handlingNotes: string;
  availability: string;
  location: string;
  county: string;
};

const initialDraft: HarvestDraft = {
  crop: 'Tomatoes',
  customProduce: '',
  variety: 'Roma',
  quantity: '220',
  unit: 'kg',
  harvestDate: '2026-10-26',
  harvestTime: '09:30',
  handlingNotes: 'Collected in ventilated crates and kept in shade.',
  availability: 'Available today',
  location: 'Nyakundi farm',
  county: 'Kisii',
};

export function IntakeWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialDraft);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const photoPreviews = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);

  useEffect(() => () => photoPreviews.forEach((preview) => URL.revokeObjectURL(preview)), [photoPreviews]);

  const update = (field: keyof HarvestDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const produceName = draft.crop === 'Other agricultural produce' ? draft.customProduce.trim() : draft.crop;
  const validate = () => {
    if (step === 0 && (!produceName || Number(draft.quantity) <= 0)) return 'Choose a produce type and enter a quantity greater than zero.';
    if (step === 2 && (!draft.location || !draft.county)) return 'Enter the farm or collection point and county.';
    return '';
  };
  const next = () => {
    const message = validate();
    if (message) return setError(message);
    setError('');
    setStep((current) => Math.min(current + 1, 4));
  };
  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const requestKey = idempotencyKey || crypto.randomUUID();
      if (!idempotencyKey) setIdempotencyKey(requestKey);
      const response = await fetch('/api/harvests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey },
        body: JSON.stringify({
          crop: produceName,
          variety: draft.variety,
          quantity: Number(draft.quantity),
          harvestDate: new Date(`${draft.harvestDate}T${draft.harvestTime}:00`).toISOString(),
          unit: draft.unit,
          handlingNotes: draft.handlingNotes,
          availability: draft.availability,
          location: draft.location,
          county: draft.county,
          idempotencyKey: requestKey,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? 'The harvest could not be saved.');
      if (photos.length > 0) {
        const form = new FormData();
        photos.forEach((file) => form.append('photos', file));
        const photoResponse = await fetch(`/api/harvests/${result.harvest.id}/photos`, { method: 'POST', body: form });
        const photoResult = await photoResponse.json();
        if (!photoResponse.ok) {
          throw new Error(`Harvest ${result.harvest.id} was saved, but the photos were not uploaded: ${photoResult.error?.message ?? 'Upload failed.'}`);
        }
      }
      setReference(result.harvest.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save harvest.');
    } finally {
      setSubmitting(false);
    }
  };

  if (reference) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#00C896] text-white shadow-lg">
          <Check size={32} />
        </span>
        <p className="mt-7 text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Harvest registered</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#17191D]">Reference {reference}</h1>
        <p className="mt-3 text-sm text-[#74767B]">Your harvest has been saved. A visible-condition assessment can be requested next.</p>
        <Link href={`/harvests/${reference}`} className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-6 text-sm font-bold text-white shadow-md transition active:scale-98">
          Open harvest intelligence <ChevronRight size={17} />
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 lg:py-10">
      <h1 className="sr-only">Register a harvest</h1>
      <div className="mb-8">
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Step {step + 1} of 5</p>
        <div className="mt-3 flex gap-2" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((label, index) => (
            <span key={label} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= step ? 'bg-[#FF5A1F]' : 'bg-[#E2DED6]'}`} title={label} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-8 shadow-xs">
        {step === 0 && (
          <Fieldset title="What did you harvest?" copy="Start with the essential quantity. Optional details can be added later.">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectGroup label="Produce" value={draft.crop} onChange={(value) => update('crop', value)} groups={produceGroups} />
              {draft.crop === 'Other agricultural produce' ? (
                <Input label="Agricultural produce name" value={draft.customProduce} onChange={(value) => update('customProduce', value)} placeholder="Enter the exact produce" />
              ) : (
                <Input label="Variety or breed, if known" value={draft.variety} onChange={(value) => update('variety', value)} placeholder="e.g. Roma or Friesian" />
              )}
              <Input label="Quantity" value={draft.quantity} onChange={(value) => update('quantity', value)} type="number" min="0.01" />
              <Select label="Unit" value={draft.unit} onChange={(value) => update('unit', value)} options={[...HARVEST_UNITS]} />
            </div>
          </Fieldset>
        )}
        {step === 1 && (
          <Fieldset title="When and how was it harvested?" copy="Use the details you can verify. You can edit these entries before submitting.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Harvest date" value={draft.harvestDate} onChange={(value) => update('harvestDate', value)} type="date" />
              <Input label="Harvest time" value={draft.harvestTime} onChange={(value) => update('harvestTime', value)} type="time" />
              <Select label="Availability" value={draft.availability} onChange={(value) => update('availability', value)} options={['Available today', 'Available in 2–3 days', 'Available this week']} />
              <div className="sm:col-span-2"><TextArea label="Handling or storage conditions" value={draft.handlingNotes} onChange={(value) => update('handlingNotes', value)} /></div>
            </div>
          </Fieldset>
        )}
        {step === 2 && (
          <Fieldset title="Where is the produce?" copy="This helps buyers and collection partners plan an exact handoff.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Farm or collection point" value={draft.location} onChange={(value) => update('location', value)} />
              <Select label="County" value={draft.county} onChange={(value) => update('county', value)} options={['Kisii', 'Nyamira']} />
              <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E2DED6] text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition sm:col-span-2">
                <MapPin size={17} className="text-[#FF5A1F]" /> Use my current location
              </button>
            </div>
          </Fieldset>
        )}
        {step === 3 && (
          <Fieldset title="Add produce photos" copy="Use clear, recent photos of the visible lot. JPEG and PNG are accepted; do not use more than five.">
            <label className="grid min-h-52 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-[#E2DED6] bg-[#FAF9F5] px-5 text-center hover:border-[#FF5A1F] transition">
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => setPhotos(Array.from(event.target.files ?? []).slice(0, 5))} />
              <span>
                <Camera size={32} className="mx-auto text-[#FF5A1F]" />
                <span className="mt-3 block text-sm font-bold text-[#17191D]">Open camera or choose photos</span>
                <span className="mt-1 block text-xs text-[#74767B]">JPG or PNG · up to 5 images</span>
              </span>produceName
            </label>
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photoPreviews.map((photo, index) => (
                  <Image key={`${photos[index].name}-${index}`} src={photo} alt="Selected harvest preview" width={400} height={400} unoptimized className="aspect-square w-full rounded-xl object-cover border border-[#E2DED6]" />
                ))}
              </div>
            )}
          </Fieldset>
        )}
        {step === 4 && (
          <Fieldset title="Review your harvest" copy="Check the summary before submitting. Nothing is sent to buyers automatically.">
            <dl className="divide-y divide-[#E2DED6] border-y border-[#E2DED6]">
              {[
                ['Produce', `${draft.quantity} ${draft.unit} ${produceName}${draft.variety ? ` · ${draft.variety}` : ''}`],
                ['Harvested', `${draft.harvestDate} at ${draft.harvestTime}`],
                ['Location', `${draft.location}, ${draft.county}`],
                ['Availability', draft.availability],
                ['Photos', `${photos.length || 'No'} photo${photos.length === 1 ? '' : 's'} selected`],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[120px_1fr] gap-3 py-3 text-sm">
                  <dt className="text-[#74767B]">{label}</dt>
                  <dd className="font-semibold text-[#17191D]">{value}</dd>
                </div>
              ))}
            </dl>
          </Fieldset>
        )}

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#E2DED6] pt-5">
          <button type="button" disabled={step === 0} onClick={() => setStep((current) => current - 1)} className="flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[#74767B] hover:text-[#17191D] disabled:opacity-30">
            <ChevronLeft size={18} /> Back
          </button>
          {step < 4 ? (
            <button type="button" onClick={next} className="flex h-11 items-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-6 text-sm font-bold text-white shadow-sm transition active:scale-98">
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting} className="flex h-11 items-center gap-2 rounded-xl bg-[#17191D] hover:bg-[#22252A] px-6 text-sm font-bold text-white shadow-sm disabled:opacity-60 transition active:scale-98">
              <Upload size={17} /> {submitting ? 'Submitting…' : 'Submit harvest'}
            </button>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-[#74767B]">Demo workflow · entries remain in this browser session only.</p>
    </div>
  );
}

function Fieldset({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-2xl font-extrabold text-[#17191D]">{title}</legend>
      <p className="mt-2 mb-7 max-w-xl text-sm leading-6 text-[#74767B]">{copy}</p>
      {children}
    </fieldset>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, min }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; min?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#17191D]">
      {label}
      <input
        type={type}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-[#E2DED6] bg-white px-3 text-base font-normal text-[#17191D] outline-none transition focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F]"
      />
    </label>
  );
}


function SelectGroup({ label, value, onChange, groups }: { label: string; value: string; onChange: (value: string) => void; groups: Array<{ label: string; options: string[] }> }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#17191D]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-[#E2DED6] bg-white px-3 text-base font-normal text-[#17191D] outline-none transition focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F]"
      >
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#17191D]">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="resize-none rounded-xl border border-[#E2DED6] bg-white p-3 text-base font-normal text-[#17191D] outline-none transition focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F]"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#17191D]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-[#E2DED6] bg-white px-3 text-base font-normal text-[#17191D] outline-none transition focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F]"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
