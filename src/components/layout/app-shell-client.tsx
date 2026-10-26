'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Boxes, LayoutDashboard, Leaf, Menu, PackageSearch, Sprout, Store, Warehouse, Truck, BellRing, PackageOpen, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/harvests', label: 'My harvests', icon: Sprout },
  { href: '/harvests/new', label: 'Register harvest', icon: Leaf },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/offers', label: 'Offers & bookings', icon: Boxes },
  { href: '/storage', label: 'Find storage', icon: Warehouse },
  { href: '/storage/requests', label: 'Storage requests', icon: PackageOpen },
  { href: '/storage/inventory', label: 'My stored produce', icon: Boxes },
  { href: '/transport', label: 'Transport & collections', icon: Truck },
  { href: '/storage/alerts', label: 'Storage alerts', icon: BellRing },
];

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => href === '/harvests' ? pathname.startsWith('/harvests') && pathname !== '/harvests/new' : pathname === href;

  return (
    <div className="min-h-screen bg-[#FFFFFF] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-[248px] border-r border-[#004A25]/10 bg-[#004A25] p-4 text-[#FFFFFF] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', menuOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-2 py-2"><Link href="/" className="flex items-center gap-2" aria-label="KAVANDOR home"><span className="grid size-9 place-items-center rounded-lg bg-[#F2C303] text-[#004A25]"><Leaf size={19} strokeWidth={2.2} /></span><span className="text-lg font-bold">KAVANDOR</span></Link><button type="button" onClick={() => setMenuOpen(false)} className="grid size-10 place-items-center rounded-md lg:hidden" aria-label="Close navigation"><X size={20} /></button></div>
          <nav className="mt-8 space-y-1" aria-label="Farmer navigation">{navigation.map((item) => { const Icon = item.icon; const active = isActive(item.href); return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={cn('flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors', active ? 'bg-[#F2C303] text-[#004A25]' : 'text-[#FFFFFF]/70 hover:bg-white/8 hover:text-white')}><Icon size={19} />{item.label}</Link>; })}</nav>
          <div className="mt-auto border-t border-white/10 pt-4"><div className="flex items-center gap-3 px-2"><span className="grid size-9 place-items-center rounded-full bg-[#FFFFFF] text-sm font-bold text-[#004A25]">JN</span><div className="min-w-0"><p className="truncate text-sm font-semibold">James Nyakundi</p><p className="text-xs text-[#FFFFFF]/55">Farmer · Kisii</p></div></div></div>
        </div>
      </aside>
      {menuOpen && <button type="button" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-[#004A25]/45 lg:hidden" aria-label="Close navigation overlay" />}
      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#004A25]/10 bg-[#FFFFFF]/95 px-4 backdrop-blur lg:px-8"><button type="button" onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-md border border-[#004A25]/10 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button><div className="hidden items-center gap-2 text-sm text-[#3E594B] sm:flex"><Leaf size={16} className="text-[#76AC3C]" /><span>Nyakundi farm</span><span className="text-[#004A25]/25">·</span><span>Kisii, Kenya</span></div><div className="ml-auto flex items-center gap-2"><span className="hidden rounded-full border border-[#004A25]/10 px-3 py-1.5 text-xs font-semibold text-[#3E594B] md:inline">Demo workspace</span><button type="button" className="relative grid size-10 place-items-center rounded-full border border-[#004A25]/10" aria-label="Notifications"><Bell size={19} /><span className="absolute right-2 top-2 size-2 rounded-full bg-[#F2C303] ring-2 ring-[#FFFFFF]" /></button></div></header>
        <main>{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t border-[#004A25]/10 bg-[#FFFFFF] px-1 lg:hidden" aria-label="Quick navigation">{[navigation[0], navigation[1], navigation[2], navigation[5], navigation[8]].map((item) => { const Icon = item.icon; const active = isActive(item.href); return <Link key={item.href} href={item.href} className={cn('flex flex-col items-center justify-center gap-1 px-1 text-center text-[9px] font-semibold', active ? 'text-[#004A25]' : 'text-[#3E594B]')}><Icon size={18} strokeWidth={active ? 2.5 : 1.8} />{item.label.replace('Register harvest', 'Register').replace('Transport & collections', 'Transport').replace('Storage alerts', 'Alerts')}</Link>; })}</nav>
    </div>
  );
}

export function DemoNotice({ children = 'Demo data for Gusii Innovation Week 2026' }: { children?: React.ReactNode }) {
  return <div className="flex items-start gap-2 rounded-lg border border-[#004A25]/10 bg-white px-3 py-2.5 text-xs text-[#3E594B]"><PackageSearch size={16} className="mt-px shrink-0 text-[#76AC3C]" /><span>{children}</span></div>;
}
