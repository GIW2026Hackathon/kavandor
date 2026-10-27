'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Boxes,
  Check,
  ChevronDown,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  PackageOpen,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Store,
  Truck,
  Warehouse,
  BellRing,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { KavandorLogo } from '@/components/ui/logo';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export type WorkspaceRole = 'farmer' | 'buyer' | 'facility_operator' | 'transport_provider';

interface RoleProfile {
  initials: string;
  name: string;
  subtitle: string;
  roleLabel: string;
  location: string;
  badge: string;
  icon: typeof Sprout;
  defaultDestination: string;
  themeColor: string;
  themeBg: string;
}

const roleProfiles: Record<WorkspaceRole, RoleProfile> = {
  farmer: {
    initials: 'JN',
    name: 'James Nyakundi',
    subtitle: 'Smallholder Farmer',
    roleLabel: 'Farmer Workspace',
    location: 'Nyakundi Farm · Kisii',
    badge: 'Producer',
    icon: Sprout,
    defaultDestination: '/dashboard',
    themeColor: 'text-emerald-700',
    themeBg: 'bg-emerald-500',
  },
  buyer: {
    initials: 'FL',
    name: 'FreshLink Kisii',
    subtitle: 'Wholesale Buyer / Aggregator',
    roleLabel: 'Buyer Workspace',
    location: 'Regional Sourcing Hub · Kisii',
    badge: 'Aggregator',
    icon: ShoppingCart,
    defaultDestination: '/marketplace',
    themeColor: 'text-[#FF5A1F]',
    themeBg: 'bg-[#FF5A1F]',
  },
  facility_operator: {
    initials: 'CH',
    name: 'Kisii Central Cold Hub',
    subtitle: 'Facility Operator (Bay #01)',
    roleLabel: 'Storage Operator Hub',
    location: 'Kisii Town Cold Hub',
    badge: 'Operator',
    icon: Warehouse,
    defaultDestination: '/partners',
    themeColor: 'text-blue-700',
    themeBg: 'bg-blue-600',
  },
  transport_provider: {
    initials: 'SM',
    name: 'Songa Mobility Fleet',
    subtitle: 'Transport Logistics Partner',
    roleLabel: 'Fleet Operations',
    location: 'Kisii Transit Depot',
    badge: 'Logistics',
    icon: Truck,
    defaultDestination: '/transport',
    themeColor: 'text-amber-700',
    themeBg: 'bg-amber-600',
  },
};

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

const buyerNavigation = [
  { href: '/marketplace', label: 'Produce exchange', icon: Store },
  { href: '/offers', label: 'Bids & escrow contracts', icon: Boxes },
  { href: '/storage/inventory', label: 'Purchased produce', icon: PackageOpen },
  { href: '/transport', label: 'Logistics & handoff', icon: Truck },
  { href: '/storage', label: 'Cold hub network', icon: Warehouse },
  { href: '/dashboard', label: 'Market trends', icon: LayoutDashboard },
];

const facilityOperatorNavigation = [
  { href: '/partners', label: 'Operations overview', icon: LayoutDashboard },
  { href: '/storage/requests', label: 'Intake & release requests', icon: PackageOpen },
  { href: '/storage/inventory', label: 'Cold room bay ledger', icon: Boxes },
  { href: '/storage/facility-01/conditions', label: 'Bay climate telemetry', icon: BellRing },
  { href: '/storage/alerts', label: 'Climate alerts', icon: BellRing },
  { href: '/storage', label: 'Facility network', icon: Warehouse },
];

const transportProviderNavigation = [
  { href: '/transport', label: 'Transport overview', icon: LayoutDashboard },
  { href: '/transport/requests/TJ-2026-001', label: 'Active collection route', icon: Truck },
  { href: '/storage/requests', label: 'Delivery handoffs', icon: PackageOpen },
  { href: '/storage', label: 'Cold hub network', icon: Warehouse },
];

const roleNavigation: Record<WorkspaceRole, typeof farmerNavigation> = {
  farmer: farmerNavigation,
  buyer: buyerNavigation,
  facility_operator: facilityOperatorNavigation,
  transport_provider: transportProviderNavigation,
};

function persistActiveRole(newRole: WorkspaceRole) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `kavandor_active_role=${newRole}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    localStorage.setItem('kavandor_active_role', newRole);
  } catch {
    // non-blocking
  }
}

function clearActiveRole() {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = 'kavandor_active_role=; path=/; max-age=0; SameSite=Lax';
    localStorage.removeItem('kavandor_active_role');
    localStorage.removeItem('kavandor_auth_role');
  } catch {
    // non-blocking
  }
}

export function AppShellClient({
  children,
  role = 'farmer',
}: {
  children: React.ReactNode;
  role?: WorkspaceRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<WorkspaceRole>(role);

  // Sync role from cookie/localStorage if user previously authenticated as another role
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const match = document.cookie.match(/(?:^|;\s*)kavandor_active_role=([^;]+)/);
        const cookieRole = match ? (decodeURIComponent(match[1]) as WorkspaceRole) : null;
        const storedRole = (localStorage.getItem('kavandor_active_role') as WorkspaceRole) || cookieRole;
        if (storedRole && storedRole in roleProfiles && role === 'farmer') {
          setActiveRole(storedRole);
        } else {
          setActiveRole(role);
        }
      } catch {
        setActiveRole(role);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [role]);

  const profile = useMemo(() => roleProfiles[activeRole] || roleProfiles.farmer, [activeRole]);
  const navigation = useMemo(() => roleNavigation[activeRole] || farmerNavigation, [activeRole]);

  const quickNavigation = useMemo(() => {
    if (activeRole === 'farmer') {
      return [navigation[0], navigation[1], navigation[2], navigation[7], navigation[8]];
    }
    return navigation.slice(0, 5);
  }, [activeRole, navigation]);

  const isActive = (href: string) => {
    if (href === '/harvests') {
      return pathname.startsWith('/harvests') && pathname !== '/harvests/new';
    }
    if (href === '/partners') {
      return pathname.startsWith('/partners');
    }
    return pathname === href;
  };

  const handleSwitchRole = (newRole: WorkspaceRole) => {
    setActiveRole(newRole);
    setRoleMenuOpen(false);
    setMenuOpen(false);
    persistActiveRole(newRole);
    const dest = roleProfiles[newRole].defaultDestination;
    router.push(dest);
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearActiveRole();
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#212329] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[260px] border-r border-[#22252A] bg-[#17191D] p-4 text-[#FFFFFF] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 flex flex-col justify-between',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand header */}
          <div className="flex items-center justify-between px-2 py-2">
            <Link href="/" className="group flex items-center" aria-label="KAVANDOR home">
              <KavandorLogo textColor="text-white" iconSize={26} />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid size-10 place-items-center rounded-md text-neutral-400 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          {/* Active Role Indicator Badge */}
          <div className="mt-4 px-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#22252A] px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${profile.themeBg} animate-pulse`} />
                <span className="font-bold text-white tracking-wide">{profile.roleLabel}</span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold text-[#FF5A1F] bg-[#FF5A1F]/15 px-2 py-0.5 rounded-md">
                {profile.badge}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav
            className="mt-6 flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar"
            aria-label={`${profile.roleLabel} navigation`}
          >
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
                  <Icon size={18} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card & Workspace Switcher */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-[#22252A] p-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">
                {profile.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{profile.name}</p>
                <p className="truncate text-xs text-neutral-400">{profile.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white transition"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {menuOpen && (
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
          aria-label="Close navigation overlay"
        />
      )}

      {/* Main Content Area */}
      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E2DED6] bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid size-10 place-items-center rounded-md border border-[#E2DED6] text-[#17191D] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            {/* Context location badge */}
            <div className="hidden items-center gap-2 text-sm text-[#74767B] sm:flex">
              <Leaf size={16} className="text-[#FF5A1F]" />
              <span className="font-semibold text-[#17191D]">{profile.name}</span>
              <span className="text-[#74767B]/40">·</span>
              <span>{profile.location}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Interactive Workspace / Role Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] px-3 py-1.5 text-xs font-bold text-[#17191D] hover:bg-white hover:border-[#FF5A1F] transition shadow-2xs"
                aria-expanded={roleMenuOpen}
                aria-haspopup="true"
              >
                <span className={`size-2 rounded-full ${profile.themeBg}`} />
                <span>{profile.roleLabel}</span>
                <ChevronDown size={14} className={cn('transition-transform', roleMenuOpen && 'rotate-180')} />
              </button>

              {roleMenuOpen && (
                <>
                  <button
                    type="button"
                    onClick={() => setRoleMenuOpen(false)}
                    className="fixed inset-0 z-40 bg-transparent"
                    aria-label="Close role menu"
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-[#E2DED6] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    <p className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#74767B]">
                      Switch Workspace Role
                    </p>
                    <div className="space-y-1">
                      {(Object.keys(roleProfiles) as WorkspaceRole[]).map((rKey) => {
                        const rProf = roleProfiles[rKey];
                        const Icon = rProf.icon;
                        const isCurrent = activeRole === rKey;
                        return (
                          <button
                            key={rKey}
                            type="button"
                            onClick={() => handleSwitchRole(rKey)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition',
                              isCurrent
                                ? 'bg-[#FFF8F5] text-[#FF5A1F] font-bold'
                                : 'text-[#17191D] hover:bg-[#FAF9F5]',
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon size={16} className={isCurrent ? 'text-[#FF5A1F]' : 'text-[#74767B]'} />
                              <div>
                                <p className="font-semibold leading-tight">{rProf.roleLabel}</p>
                                <p className="text-[10px] text-[#74767B]">{rProf.badge}</p>
                              </div>
                            </div>
                            {isCurrent && <Check size={14} className="text-[#FF5A1F]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live Network Badge */}
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 md:inline-flex">
              <ShieldCheck size={14} className="text-emerald-600" />
              Kisii &amp; Nyamira Network
            </span>

            {/* Notifications */}
            <Link
              href="/storage/alerts"
              className="relative grid size-10 place-items-center rounded-full border border-[#E2DED6] text-[#17191D] hover:bg-[#FAF9F5] transition"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#FF5A1F] ring-2 ring-white" />
            </Link>
          </div>
        </header>

        <main>{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t border-[#E2DED6] bg-white px-1 lg:hidden"
        aria-label="Quick mobile navigation"
      >
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
              <span className="truncate max-w-full">
                {item.label
                  .replace('Register harvest', 'Register')
                  .replace('Transport & collections', 'Transport')
                  .replace('Storage alerts', 'Alerts')
                  .replace('Produce exchange', 'Market')
                  .replace('Bids & escrow contracts', 'Bids')
                  .replace('Cold room bay ledger', 'Ledger')
                  .replace('Bay climate telemetry', 'Climate')}
              </span>
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
