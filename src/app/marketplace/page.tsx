import Link from 'next/link';
import { ArrowRight, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { QuantityDisplay } from '@/components/ui/quantity-display';
import { StatusBadge } from '@/components/ui/status-badge';

export default function MarketplacePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase text-[#3E594B]">Farmer marketplace</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Available produce</h1><p className="mt-2 text-sm text-[#3E594B]">Review traceable demo listings and current offers.</p></div><button type="button" className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#004A25]/15 px-4 text-sm font-bold"><SlidersHorizontal size={17} /> Filters</button></div>

        <div className="mt-7 flex h-12 items-center gap-3 border border-[#004A25]/15 bg-white px-4"><Search size={18} className="text-[#3E594B]" /><input aria-label="Search produce" className="h-full min-w-0 flex-1 outline-none" placeholder="Search crop or location" /></div>

        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <article className="border border-[#004A25]/10 bg-white">
            <div className="relative min-h-52 overflow-hidden bg-[linear-gradient(145deg,#76AC3C,#004A25)]"><span className="absolute left-4 top-4"><StatusBadge status="offer_pending" /></span><div className="absolute bottom-4 left-4 right-4 flex items-end justify-between bg-[#004A25]/90 p-4 text-white"><div><p className="text-xs text-white/60">Tomatoes · Roma</p><QuantityDisplay quantity={220} unit="kg" /></div></div></div>
            <div className="p-5"><h2 className="text-xl font-bold">Nyakundi farm lot</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-[#3E594B]"><MapPin size={15} /> Nyakundi, Kisii · Available today</p><p className="mt-4 text-sm leading-6 text-[#3E594B]">Mostly firm fruit with mixed colour. Visible-condition assessment is preliminary.</p><div className="mt-5 flex items-end justify-between border-t border-[#004A25]/10 pt-5"><div><p className="text-xs text-[#3E594B]">Highest demo offer</p><p className="mt-1 text-xl font-bold">KSh 4,000 <span className="text-xs font-semibold text-[#3E594B]">total</span></p></div><Link href="/offers" className="flex h-10 items-center gap-2 text-sm font-bold">View offer <ArrowRight size={16} /></Link></div></div>
          </article>

          <article className="border border-[#004A25]/10 bg-[#FFFFFF]">
            <div className="grid min-h-52 place-items-center bg-[#DCE8D5] px-6 text-center"><div><p className="text-xs font-bold uppercase text-[#3E594B]">Other demo listing</p><h2 className="mt-3 text-2xl font-bold">Banana lot</h2><p className="mt-2 text-sm text-[#3E594B]">8 crates · Nyamira</p></div></div>
            <div className="p-5"><p className="text-sm text-[#3E594B]">A complete listing becomes available after the produce photo and handling details are verified.</p><button type="button" disabled className="mt-5 h-10 w-full border border-[#004A25]/10 text-sm font-bold text-[#3E594B]">Not currently actionable</button></div>
          </article>
        </section>
        <div className="mt-6"><DemoNotice>Seeded marketplace listing. Prices and buyers are simulated.</DemoNotice></div>
      </div>
    </AppShell>
  );
}
