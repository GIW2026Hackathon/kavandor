import Link from 'next/link';
import { ArrowRight, Leaf, MoveRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FFFFFF] text-[#004A25]">
      <header className="border-b border-[#004A25]/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="KAVANDOR home">
            <span className="grid size-9 place-items-center rounded-lg bg-[#004A25] text-[#F2C303]"><Leaf size={19} /></span>
            <span className="font-bold">KAVANDOR</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-7 text-sm font-semibold md:flex">
            <a href="#how">How it works</a><a href="#audience">For farmers</a><a href="#audience">For buyers</a>
          </nav>
          <Link href="/dashboard" className="ml-5 rounded-lg border border-[#004A25]/15 px-4 py-2 text-sm font-bold">Sign in</Link>
          <Link href="/harvests/new" className="ml-2 hidden rounded-lg bg-[#F2C303] px-4 py-2 text-sm font-bold sm:block">Get started</Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-5 text-xs font-bold uppercase text-[#76AC3C]">Harvest intelligence · Kisii & Nyamira</p>
          <h1 className="max-w-xl text-5xl font-black leading-[.95] sm:text-6xl lg:text-7xl">Every harvest has a next move.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#004A25]/70">Know your harvest, compare practical options and make the next move with confidence.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/harvests/new" className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#004A25] px-5 text-sm font-bold text-white">Register a harvest <ArrowRight size={17} /></Link>
            <a href="#how" className="flex h-12 items-center justify-center rounded-lg border border-[#004A25]/15 bg-white px-5 text-sm font-bold">Explore how it works</a>
          </div>
        </div>

        <div className="relative min-h-[460px] overflow-hidden bg-[linear-gradient(145deg,#76AC3C_0%,#4D812D_50%,#004A25_100%)] lg:min-h-[520px]">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute inset-x-5 bottom-5 border border-white/20 bg-[#004A25]/90 p-5 text-white backdrop-blur sm:left-auto sm:w-[320px]">
            <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase text-[#F2C303]">Demo harvest</p><span className="rounded-full border border-white/20 px-2 py-1 text-[10px]">Assessment ready</span></div>
            <p className="mt-5 text-2xl font-bold">Tomatoes · 220 kg</p>
            <p className="mt-1 text-sm text-white/60">Nyakundi farm · Kisii</p>
            <div className="mt-5 border-t border-white/15 pt-4">
              <p className="text-xs uppercase text-white/55">Best feasible next move</p>
              <div className="mt-2 flex items-end justify-between gap-3"><p className="font-bold">Sell now</p><p className="text-xl font-bold text-[#F2C303]">KSh 3,500 est.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-[#004A25]/10 bg-white">
        <div className="mx-auto grid max-w-7xl px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            ['01', 'Record your harvest', 'Capture quantity, handling and produce photos in one short flow.'],
            ['02', 'Compare your options', 'Review feasible buyers, storage or aggregation options with costs made clear.'],
            ['03', 'Track the outcome', 'Follow collection, handover and payment through a traceable timeline.'],
          ].map(([number, title, copy]) => (
            <div key={number} className="border-b border-[#004A25]/10 py-7 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0">
              <p className="text-xs font-bold text-[#76AC3C]">{number}</p><h2 className="mt-8 text-xl font-bold">{title}</h2><p className="mt-3 max-w-sm text-sm leading-6 text-[#3E594B]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="audience" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-xs font-bold uppercase text-[#3E594B]">Built around the handoff</p>
        <div className="mt-5 grid gap-px bg-[#004A25]/10 md:grid-cols-3">
          {[
            ['For farmers', 'Understand the produce you have and compare where it can go next.', '/harvests/new'],
            ['For buyers', 'Find traceable lots, make clear offers and coordinate collection.', '/marketplace'],
            ['For service providers', 'Manage capacity, requests and verified fulfilment records.', '/partners'],
          ].map(([title, copy, href]) => (
            <a href={href} key={title} className="group bg-[#FFFFFF] p-6 sm:p-8"><h2 className="text-xl font-bold">{title}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-[#3E594B]">{copy}</p><span className="mt-7 flex items-center gap-2 text-sm font-bold">Explore <MoveRight size={18} className="transition-transform group-hover:translate-x-1" /></span></a>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#004A25]/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-xs text-[#3E594B] sm:px-6 sm:flex-row sm:items-center sm:justify-between"><p>Demo interface for Gusii Innovation Week 2026.</p><div className="flex gap-5"><a href="#">Contact</a><a href="#">Terms</a><a href="#">Privacy</a></div></div>
      </footer>
    </main>
  );
}
