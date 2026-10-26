'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Boxes, LayoutDashboard, Leaf, Menu, PackageSearch, Sprout, Store, Warehouse, Truck, BellRing, PackageOpen, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { KavandorLogo } from '@/components/ui/logo';

export type WorkspaceRole = 'farmer' | 'facility_operator' | 'transport_provider';

const farmerNavigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/harvests/new', label: 'Register harvest', icon: Leaf },
  { href: '/harvests', label: 'My harvests', icon: Sprout },
  { href: '/storage', label: 'Find storage', icon: Warehouse },
  { href: '/storage/requests', label: 'Storage requests', icon: PackageOpen },
  { href: '/storage/inventory', label: 'My stored produce', icon: Boxes },
  { href: '/storage/alerts', label: 'Storage alerts', icon: BellRing },
  { href: '/transport', label: 'Transport & collections', icon: Truck },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/offers', label: 'Offers & bookings', icon: Boxes },
];

const roleNavigation: Record<WorkspaceRole, typeof farmerNavigation> = {
  farmer: farmerNavigation,
  facility_operator: [
    { href: '/partners', label: 'Operations overview', icon: LayoutDashboard },
    { href: '/storage/requests', label: 'Incoming requests', icon: PackageOpen },
    { href: '/storage/inventory', label: 'Stored produce', icon: Boxes },
    { href: '/storage/facility-01/conditions', label: 'Conditions', icon: BellRing },
    { href: '/storage/alerts', label: 'Alerts', icon: BellRing },
  ],
  transport_provider: [
    { href: '/transport', label: 'Transport overview', icon: LayoutDashboard },
    { href: '/transport/requests/SONGA-DEMO-001', label: 'Active pickups', icon: Truck },
    { href: '/storage/requests', label: 'Delivery handoffs', icon: PackageOpen },
  ],
};

export function AppShellClient({ children, role = 'farmer' }: { children: React.ReactNode; role?: WorkspaceRole }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = roleNavigation[role];
  const profile = role === 'facility_operator'
    ? { initials: 'CS', name: 'Kisii Cold Store', subtitle: 'Facility operator' }
    : role === 'transport_provider'
      ? { initials: 'SM', name: 'Songa Mobility', subtitle: 'Transport provider' }
      : { initials: 'JN', name: 'James Nyakundi', subtitle: 'Farmer · Kisii' };
  const quickNavigation = role === 'farmer'
    ? [navigation[0], navigation[1], navigation[2], navigation[7], navigation[8]]
    : navigation.slice(0, 5);
  const isActive = (href: string) => href === '/harvests' ? pathname.startsWith('/harvests') && pathname !== '/harvests/new' : pathname === href || (role !== 'farmer' && href === '/partners' && pathname.startsWith('/partners'));

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#212329] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-[248px] border-r border-[#22252A] bg-[#17191D] p-4 text-[#FFFFFF] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', menuOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-2 py-2">
            <Link href="/" className="group flex items-center" aria-label="KAVANDOR home">
              <KavandorLogo textColor="text-white" iconSize={26} />
            </Link>
            <button type="button" onClick={() => setMenuOpen(false)} className="grid size-10 place-items-center rounded-md text-neutral-400 hover:text-white lg:hidden" aria-label="Close navigation">
              <X size={20} />
            </button>
          </div>
          <nav className="mt-8 space-y-1" aria-label={`${role === 'farmer' ? 'Farmer' : role === 'facility_operator' ? 'Facility operator' : 'Transport provider'} navigation`}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[#FF5A1F] text-white shadow-sm font-semibold'
                      : 'text-neutral-400 hover:bg-white/8 hover:text-white',
                  )}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 rounded-lg bg-[#22252A] p-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">
                {profile.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{profile.name}</p>
                <p className="text-xs text-neutral-400">{profile.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      {menuOpen && <button type="button" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden" aria-label="Close navigation overlay" />}
      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E2DED6] bg-white/95 px-4 backdrop-blur lg:px-8">
          <button type="button" onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-md border border-[#E2DED6] text-[#17191D] lg:hidden" aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="hidden items-center gap-2 text-sm text-[#74767B] sm:flex">
            <Leaf size={16} className="text-[#FF5A1F]" />
            <span className="font-medium text-[#17191D]">Nyakundi farm</span>
            <span className="text-[#74767B]/40">·</span>
            <span>Kisii, Kenya</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 md:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Network · Kisii &amp; Nyamira
            </span>
            <button type="button" className="relative grid size-10 place-items-center rounded-full border border-[#E2DED6] text-[#17191D] hover:bg-[#FAF9F5]" aria-label="Notifications">
              <Bell size={19} />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-[#FF5A1F] ring-2 ring-white" />
            </button>
          </div>
        </header>
        <main>{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t border-[#E2DED6] bg-white px-1 lg:hidden" aria-label="Quick navigation">
        {quickNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-1 text-center text-[9px] font-semibold transition-colors',
                active ? 'text-[#FF5A1F]' : 'text-[#74767B]',
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              {item.label.replace('Register harvest', 'Register').replace('Transport & collections', 'Transport').replace('Storage alerts', 'Alerts')}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function DemoNotice({ children }: { children?: React.ReactNode }) {
  void children;
  return null;
}
