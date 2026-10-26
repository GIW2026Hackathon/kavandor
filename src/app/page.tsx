import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/harvests/new', label: 'New harvest' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/offers', label: 'Offers' },
  { href: '/partners', label: 'Partners' },
];

const workflow = [
  'Harvest intake and crop context',
  'Visible-condition AI assessment',
  'Net-proceeds and next-action comparison',
  'Marketplace and buyer negotiation',
  'Facility, transport, and handoff tracking',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F5F3EC] text-[#20211F]">
      <header className="border-b border-[#20211F]/10 bg-[#F5F3EC]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#85877F]">KAVANDOR</p>
            <h1 className="text-lg font-bold">Every harvest has a next move.</h1>
          </div>
          <nav className="hidden gap-6 text-sm md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[#20211F]/70">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/harvests/new" className="rounded-full bg-[#D6FF3F] px-5 py-2 text-sm font-semibold text-[#20211F] shadow-sm">
            Start harvest
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-[#20211F]/10 bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#85877F]">
            Intelligent harvest & supply network
          </p>
          <h2 className="max-w-xl text-4xl font-black tracking-tight md:text-6xl">
            Harvest clarity for farmers across Kisii and Nyamira.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-[#20211F]/75">
            KAVANDOR helps farmers assess visible crop conditions, compare practical next actions, and coordinate sale or post-harvest flows with transparent demo assumptions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/harvests/new" className="rounded-full bg-[#20211F] px-6 py-3 text-center font-semibold text-[#F5F3EC]">
              Log a harvest
            </Link>
            <Link href="/dashboard" className="rounded-full border border-[#20211F]/15 bg-white px-6 py-3 text-center font-semibold text-[#20211F]">
              View dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-[#20211F]/10 bg-[#20211F] p-6 text-[#F5F3EC] shadow-xl">
          <p className="text-sm uppercase tracking-[0.18em] text-[#D6FF3F]">Demo scenario</p>
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span>Crop</span>
              <span className="font-semibold">Tomato</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span>Location</span>
              <span className="font-semibold">Kisii</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span>Lot size</span>
              <span className="font-semibold">220 kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Decision</span>
              <span className="font-semibold text-[#D6FF3F]">Sell or store</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h3 className="text-2xl font-bold">Core workflow</h3>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {workflow.map((step, index) => (
            <div key={step} className="rounded-2xl border border-[#20211F]/10 bg-white p-5">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#D6FF3F] text-sm font-bold text-[#20211F]">
                {index + 1}
              </div>
              <p className="text-sm text-[#20211F]/80">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
