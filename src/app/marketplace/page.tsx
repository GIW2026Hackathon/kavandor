import Link from 'next/link';
import { ArrowRight, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { StatusBadge } from '@/components/ui/status-badge';

export default function MarketplacePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Regional Agricultural Exchange</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">Available produce lots</h1>
            <p className="mt-2 text-sm text-[#74767B]">Verified regional horticultural lots available for wholesale contract and cold chain aggregation.</p>
          </div>
          <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-4 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs">
            <SlidersHorizontal size={17} /> Filters
          </button>
        </div>

        <div className="mt-7 flex h-12 items-center gap-3 rounded-xl border border-[#E2DED6] bg-white px-4 shadow-2xs focus-within:border-[#FF5A1F] transition">
          <Search size={18} className="text-[#74767B]" />
          <input aria-label="Search produce" className="h-full min-w-0 flex-1 bg-transparent text-[#17191D] outline-none" placeholder="Search crop or location in Kisii & Nyamira" />
        </div>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-[#E2DED6] bg-white overflow-hidden shadow-xs hover:border-[#FF5A1F] transition">
            <div className="relative min-h-52 overflow-hidden bg-[linear-gradient(145deg,#22252A,#17191D)] p-4">
              <span className="absolute left-4 top-4">
                <StatusBadge status="offer_pending" />
              </span>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between rounded-xl border border-white/10 bg-[#17191D]/90 p-4 text-white backdrop-blur-md">
                <div>
                  <p className="text-xs font-mono uppercase text-[#FF5A1F]">Tomatoes · Roma</p>
                  <p className="mt-1 text-2xl font-extrabold font-mono">220 <span className="text-sm font-normal text-neutral-400">kg</span></p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#17191D]">Nyakundi Farmgate Lot</h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-[#74767B]">
                <MapPin size={15} className="text-[#FF5A1F]" /> Nyakundi, Kisii · Available for dispatch
              </p>
              <p className="mt-4 text-sm leading-6 text-[#74767B]">
                Grade A-Standard firm tomatoes. Pre-screened with AI vision appraisal and verified by field agent.
              </p>
              <div className="mt-6 flex items-end justify-between border-t border-[#E2DED6] pt-5">
                <div>
                  <p className="text-xs font-mono uppercase text-[#74767B]">Current purchase offer</p>
                  <p className="mt-1 text-2xl font-extrabold text-[#FF5A1F] font-mono">
                    KSh 9,900 <span className="text-xs font-normal text-[#74767B]">total (KES 45/kg)</span>
                  </p>
                </div>
                <Link href="/offers" className="flex h-11 items-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-4 text-sm font-bold text-white shadow-sm transition active:scale-98">
                  View offer <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E2DED6] bg-white overflow-hidden shadow-xs">
            <div className="grid min-h-52 place-items-center bg-[#FAF9F5] border-b border-[#E2DED6] px-6 text-center">
              <div>
                <p className="text-xs font-mono font-bold uppercase text-emerald-600">Verified Producer Lot</p>
                <h2 className="mt-3 text-2xl font-bold text-[#17191D]">Ng'oina Banana Lot</h2>
                <p className="mt-1 text-sm text-[#74767B]">8 crates · Nyamira North</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm leading-6 text-[#74767B]">
                Cooking &amp; dessert bananas harvested at green maturity. Ready for solar dehydration or regional distribution.
              </p>
              <Link href="/offers" className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E2DED6] bg-white text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5] transition shadow-2xs">
                Submit purchase offer
              </Link>
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
