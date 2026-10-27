'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Boxes,
  Check,
  ChevronDown,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Navigation,
  PackageOpen,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Store,
  Thermometer,
  Truck,
  User,
  Warehouse,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { KavandorLogo } from '@/components/ui/logo';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { AuthenticatedUserProfile } from '@/lib/auth-server';

export type WorkspaceRole = 'farmer' | 'buyer' | 'facility_operator' | 'transport_provider';

interface RoleProfile {
  roleLabel: string;
  badge: string;
  icon: typeof Sprout;
  defaultDestination: string;
  themeBg: string;
}

const roleMeta: Record<WorkspaceRole, RoleProfile> = {
  farmer: {
    roleLabel: 'Farmer Workspace',
    badge: 'Producer',
    icon: Sprout,
    defaultDestination: '/dashboard',
    themeBg: 'bg-emerald-500',
  },
  buyer: {
    roleLabel: 'Buyer Workspace',
    badge: 'Aggregator',
    icon: ShoppingCart,
    defaultDestination: '/marketplace',
    themeBg: 'bg-[#FF5A1F]',
  },
  facility_operator: {
    roleLabel: 'Facility Operator',
    badge: 'Cold Hub',
    icon: Warehouse,
    defaultDestination: '/partners',
    themeBg: 'bg-blue-600',
  },
  transport_provider: {
    roleLabel: 'Transport Provider',
    badge: 'Logistics',
    icon: Truck,
    defaultDestination: '/transport',
    themeBg: 'bg-amber-600',
  },
};

// Strict Phase 2 Workspace Navigation Definitions
const farmerNavigation = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/harvests', label: 'My harvests', icon: Sprout },
  { href: '/storage', label: 'Agri-Value Chain Facilities', icon: Warehouse },
  { href: '/transport', label: 'Transport & collections', icon: Truck },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
];

const buyerNavigation = [
  { href: '/marketplace', label: 'Overview', icon: LayoutDashboard },
  { href: '/marketplace?filter=all', label: 'Find produce', icon: Store },
  { href: '/offers', label: 'Offers & purchases', icon: Boxes },
  { href: '/transport', label: 'Logistics', icon: Truck },
  { href: '/profile', label: 'Account', icon: User },
];

const facilityOperatorNavigation = [
  { href: '/partners', label: 'Operations', icon: LayoutDashboard },
  { href: '/storage/facility-01/conditions', label: 'Capacity & conditions', icon: Thermometer },
  { href: '/storage/requests', label: 'Incoming requests', icon: PackageOpen },
  { href: '/storage/inventory', label: 'Stored inventory', icon: Boxes },
  { href: '/storage/requests?tab=releases', label: 'Releases & handovers', icon: ShieldCheck },
  { href: '/profile', label: 'Account', icon: User },
];

const transportProviderNavigation = [
  { href: '/transport', label: 'Available jobs', icon: LayoutDashboard },
  { href: '/transport?tab=collections', label: 'My collections', icon: Truck },
  { href: '/transport/requests/TJ-2026-001', label: 'Active deliveries', icon: Navigation },
  { href: '/transport?tab=history', label: 'Handover history', icon: History },
  { href: '/profile', label: 'Account', icon: User },
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
  userProfile,
}: {
  children: React.ReactNode;
  userProfile: AuthenticatedUserProfile;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  // Authoritative role derived directly from server verification
  const activeRole: WorkspaceRole =
    userProfile.role in roleMeta ? (userProfile.role as WorkspaceRole) : 'farmer';

  const meta = useMemo(() => roleMeta[activeRole] || roleMeta.farmer, [activeRole]);
  const navigation = useMemo(() => roleNavigation[activeRole] || farmerNavigation, [activeRole]);

  const initials = useMemo(() => {
    const parts = (userProfile.fullName || 'James Nyakundi').split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (userProfile.fullName || 'K')[0].toUpperCase();
  }, [userProfile.fullName]);

  const isActive = (href: string) => {
    const cleanHref = href.split('?')[0];
    if (cleanHref === '/harvests') {
      return pathname.startsWith('/harvests') && pathname !== '/harvests/new';
    }
    if (cleanHref === '/partners') {
      return pathname.startsWith('/partners');
    }
    if (cleanHref === '/storage') {
      return pathname === '/storage' || (activeRole === 'farmer' && pathname.startsWith('/storage/')) ||
        (pathname.startsWith('/storage/') && !pathname.startsWith('/storage/requests') && !pathname.startsWith('/storage/inventory') && !pathname.startsWith('/storage/alerts'));
    }
    return pathname === cleanHref;
  };

  const handleSwitchPersona = async (newRole: WorkspaceRole) => {
    setIsSwitchingRole(true);
    setRoleMenuOpen(false);
    setMenuOpen(false);
    persistActiveRole(newRole);

    // If demo mode, sign into Supabase Auth as the demo user so server session matches
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.auth.signInWithPassword({
          email: `${newRole}@kavandor.ag`,
          password: 'Password123!',
        });
      } catch {
        // non-blocking fallback
      }
    }

    const dest = roleMeta[newRole].defaultDestination;
    router.push(dest);
    router.refresh();
    setTimeout(() => setIsSwitchingRole(false), 500);
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

          {/* Active Workspace / Role Indicator Badge */}
          <div className="mt-4 px-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#22252A] px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${meta.themeBg} animate-pulse`} />
                <span className="font-bold text-white tracking-wide">{meta.roleLabel}</span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold text-[#FF5A1F] bg-[#FF5A1F]/15 px-2 py-0.5 rounded-md">
                {meta.badge}
              </span>
            </div>
            {userProfile.isDemo && (
              <p className="mt-1.5 px-1 text-[10px] font-mono text-neutral-400">
                Demo Workspace Mode · Verified local seed
              </p>
            )}
          </div>

          {/* Role Navigation Links */}
          <nav
            className="mt-6 flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar"
            aria-label={`${meta.roleLabel} navigation`}
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
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

        {/* Profile Card & Account Access */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-between gap-2 rounded-xl bg-[#22252A] p-2.5 hover:bg-[#2b2f35] transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{userProfile.fullName}</p>
                <p className="truncate text-xs text-neutral-400">{userProfile.location}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSignOut();
              }}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white transition"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </Link>
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
              <span className="font-semibold text-[#17191D]">{userProfile.fullName}</span>
              <span className="text-[#74767B]/40">·</span>
              <span>{userProfile.location}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Interactive Workspace Persona Selector (active in demo mode) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                disabled={isSwitchingRole}
                className="flex items-center gap-2 rounded-xl border border-[#E2DED6] bg-[#FAF9F5] px-3 py-1.5 text-xs font-bold text-[#17191D] hover:bg-white hover:border-[#FF5A1F] transition shadow-2xs disabled:opacity-50"
                aria-expanded={roleMenuOpen}
                aria-haspopup="true"
              >
                <span className={`size-2 rounded-full ${meta.themeBg}`} />
                <span>{meta.roleLabel}</span>
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
                      Switch Persona (Demo Mode)
                    </p>
                    <div className="space-y-1">
                      {(Object.keys(roleMeta) as WorkspaceRole[]).map((rKey) => {
                        const rProf = roleMeta[rKey];
                        const Icon = rProf.icon;
                        const isCurrent = activeRole === rKey;
                        return (
                          <button
                            key={rKey}
                            type="button"
                            onClick={() => handleSwitchPersona(rKey)}
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
              Kisii &amp; Nyamira
            </span>

            {/* Activity Notifications */}
            <Link
              href={activeRole === 'farmer' ? '/storage?section=alerts' : '/storage/alerts'}
              className="relative grid size-10 place-items-center rounded-full border border-[#E2DED6] text-[#17191D] hover:bg-[#FAF9F5] transition"
              aria-label="Activity Alerts"
            >
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#FF5A1F] ring-2 ring-white" />
            </Link>

            {/* User Profile */}
            <Link
              href="/profile"
              className="grid size-10 place-items-center rounded-full border border-[#E2DED6] bg-[#FAF9F5] text-xs font-bold text-[#17191D] hover:border-[#FF5A1F] transition"
              title="My Account"
              aria-label="My Account"
            >
              <User size={18} />
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
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-1 text-center text-[9px] font-semibold transition-colors',
                active ? 'text-[#FF5A1F]' : 'text-[#74767B]',
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className="truncate max-w-full">
                {item.label.replace('Register harvest', 'Register').replace('Transport & collections', 'Transport').replace('Storage alerts', 'Alerts').replace('Agri-Value Chain Facilities', 'Facilities')}
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
