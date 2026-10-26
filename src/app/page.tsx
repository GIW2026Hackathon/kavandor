import Link from 'next/link';
import { ArrowRight, MoveRight } from 'lucide-react';
import { KavandorLogo } from '@/components/ui/logo';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F6F3EC] text-[#212329]">
      {/* Full Bleed Hero Section — Raw video prominence, free centered composition */}
      <section className="relative flex min-h-[92vh] w-full flex-col justify-between overflow-hidden bg-black text-white lg:min-h-screen">
        {/* Background Video (Fully Visible, No Scrims) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover object-center"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Minimal Transparent Navigation Header */}
        <header className="relative z-30 w-full border-b border-white/15 bg-black/20 backdrop-blur-xs">
          <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
            {/* Left: Unboxed Bespoke Logo */}
            <Link href="/" className="group flex items-center" aria-label="KAVANDOR home">
              <KavandorLogo textColor="text-white" iconSize={32} />
            </Link>

            {/* Center: Navigation Links centered horizontally */}
            <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 text-sm font-semibold text-white">
              <a href="#how" className="drop-shadow transition hover:text-[#FF5A1F]">How it works</a>
              <a href="#audience" className="drop-shadow transition hover:text-[#FF5A1F]">For farmers</a>
              <a href="#audience" className="drop-shadow transition hover:text-[#FF5A1F]">For buyers</a>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/30 bg-black/25 px-4 py-2 text-sm font-bold text-white shadow-md backdrop-blur-md transition hover:bg-black/45"
              >
                Sign in
              </Link>
              <Link
                href="/harvests/new"
                className="hidden rounded-xl bg-[#FF5A1F] px-4 py-2 text-sm font-bold text-white shadow-xl shadow-black/40 transition hover:bg-[#E44E18] active:scale-98 sm:block"
              >
                Get started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Content — Centered freely over the background video, zero clutter */}
        <div className="relative z-20 mx-auto my-auto flex max-w-4xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 md:py-28">
          <h1 className="text-5xl font-black tracking-tight text-white leading-[1.04] sm:text-7xl lg:text-8xl drop-shadow-[0_4px_32px_rgba(0,0,0,0.95)]">
            Every harvest has a <span className="text-[#FF5A1F] drop-shadow-[0_4px_32px_rgba(0,0,0,0.95)]">next move.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg sm:text-2xl text-white font-medium leading-relaxed drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
            Know your harvest, compare practical local options, and make the next move with total confidence.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/harvests/new"
              className="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#FF5A1F] px-8 text-base font-bold text-white shadow-2xl shadow-black/70 transition-all hover:bg-[#E44E18] hover:shadow-[#FF5A1F]/30 hover:scale-[1.02] active:scale-98"
            >
              Register a harvest <ArrowRight size={18} />
            </Link>
            <a
              href="#how"
              className="flex h-14 items-center justify-center rounded-2xl border border-white/35 bg-black/30 px-8 text-base font-bold text-white backdrop-blur-md shadow-xl transition-all hover:bg-black/50 hover:border-white/55 active:scale-98"
            >
              Explore how it works
            </a>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how" className="border-b border-[#E2DED6] bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Structured 3-step workflow</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17191D]">
              From farm gate to verified settlement
            </h2>
          </div>
          <div className="grid md:grid-cols-3">
            {[
              ['01', 'Record your harvest', 'Capture quantity, handling and produce photos in one short intake flow.'],
              ['02', 'Compare your options', 'Review feasible buyers, cold storage or aggregation with all costs made clear.'],
              ['03', 'Track the outcome', 'Follow collection, handover and payment through a traceable timeline.'],
            ].map(([number, title, copy]) => (
              <div key={number} className="border-b border-[#E2DED6] py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0">
                <p className="text-sm font-mono font-black text-[#FF5A1F]">{number}</p>
                <h3 className="mt-5 text-xl font-bold text-[#17191D]">{title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#74767B]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built around the handoff */}
      <section id="audience" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className="text-xs font-mono font-bold uppercase text-[#FF5A1F] tracking-wider">Built around the handoff</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D]">
              Designed for every participant in the chain
            </h2>
          </div>
        </div>
        <div className="grid gap-px bg-[#E2DED6] rounded-2xl overflow-hidden border border-[#E2DED6] md:grid-cols-3 shadow-xs">
          {[
            ['For farmers', 'Understand the produce you have and compare where it can go next with net return projections.', '/harvests/new'],
            ['For buyers', 'Find traceable lots, make clear offers and coordinate collection with verified weight records.', '/marketplace'],
            ['For service partners', 'Manage cold storage capacity, transport requests and verified handover records.', '/partners'],
          ].map(([title, copy, href]) => (
            <a href={href} key={title} className="group bg-white p-7 sm:p-9 hover:bg-[#FAF9F5] transition">
              <h3 className="text-xl font-bold text-[#17191D] group-hover:text-[#FF5A1F] transition-colors">{title}</h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[#74767B]">{copy}</p>
              <span className="mt-8 flex items-center gap-2 text-sm font-bold text-[#17191D] group-hover:text-[#FF5A1F]">
                Explore <MoveRight size={18} className="transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2DED6] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-[#74767B] sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <p>KAVANDOR · Intelligent Harvest & Supply Network · Kisii & Nyamira</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-[#17191D]">Contact</a>
            <a href="#" className="hover:text-[#17191D]">Terms</a>
            <a href="#" className="hover:text-[#17191D]">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
