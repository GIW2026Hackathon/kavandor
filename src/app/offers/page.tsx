'use client';

import Link from 'next/link';
import { ArrowLeft, Check, PackageCheck, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { AppShell, DemoNotice } from '@/components/layout/app-shell';
import { demoTomatoOffer, formatCurrency } from '@/components/demo/session';

export default function OffersPage() {
  const [decision, setDecision] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [confirming, setConfirming] = useState(false);

  const accept = () => {
    setDecision('accepted');
    setConfirming(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-[#3E594B]"><ArrowLeft size={16} /> Dashboard</Link>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase text-[#3E594B]">Tomatoes · 220 kg · KV-2026-001</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Offer management</h1></div>
          <span className="rounded-full border border-[#004A25]/15 px-3 py-1.5 text-xs font-semibold">1 offer</span>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">
          <article className="border border-[#004A25]/10 bg-white p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase text-[#3E594B]">Demo buyer</p><h2 className="mt-2 text-2xl font-bold">FreshLink Kisii</h2><p className="mt-1 text-sm text-[#3E594B]">Offer received 26 Oct · Expires {demoTomatoOffer.expiresAt}</p></div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${decision === 'accepted' ? 'bg-[#EDF5DF] text-[#004A25]' : decision === 'rejected' ? 'bg-[#F2F4F0] text-[#3E594B]' : 'bg-[#FFF4C5] text-[#004A25]'}`}>{decision === 'accepted' ? 'Accepted' : decision === 'rejected' ? 'Rejected' : 'Pending'}</span>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-px bg-[#004A25]/10 sm:grid-cols-4">
              {[
                ['Total offer', formatCurrency(demoTomatoOffer.amount)],
                ['Price unit', `${formatCurrency(demoTomatoOffer.unitPrice)} / kg`],
                ['Quantity', `${demoTomatoOffer.quantity} ${demoTomatoOffer.unit}`],
                ['Net estimate', formatCurrency(demoTomatoOffer.amount - 500)],
              ].map(([label, value]) => <div key={label} className="bg-white p-4"><p className="text-xs text-[#3E594B]">{label}</p><p className="mt-2 text-lg font-bold">{value}</p></div>) }
            </div>

            <div className="mt-7 grid gap-5 border-t border-[#004A25]/10 pt-6 sm:grid-cols-2">
              <div><p className="text-sm font-bold">Collection terms</p><p className="mt-2 text-sm leading-6 text-[#3E594B]">Farmer to confirm collection point. Buyer arranges pickup within 18 hours of acceptance.</p></div>
              <div><p className="text-sm font-bold">Deductions shown</p><p className="mt-2 text-sm leading-6 text-[#3E594B]">KSh 300 transport · KSh 200 handling. Net estimate excludes any unconfirmed charges.</p></div>
            </div>

            {decision === 'pending' && <div className="mt-7 flex flex-col gap-3 border-t border-[#004A25]/10 pt-5 sm:flex-row">
              <button type="button" onClick={() => setConfirming(true)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#004A25] px-5 text-sm font-bold text-white"><Check size={17} /> Accept offer</button>
              <button type="button" onClick={() => setDecision('rejected')} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#004A25]/15 px-5 text-sm font-bold"><X size={17} /> Reject</button>
            </div>}
            {decision === 'accepted' && <div className="mt-7 flex flex-col gap-4 border-l-2 border-[#76AC3C] bg-[#EDF5DF] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">Agreement recorded</p><p className="mt-1 text-sm text-[#004A25]">220 kg reserved for FreshLink Kisii.</p></div><Link href="/harvests/demo-harvest-001/timeline" className="text-sm font-bold underline underline-offset-4">View traceability</Link></div>}
          </article>

          <aside className="border border-[#004A25]/10 bg-[#004A25] p-5 text-[#FFFFFF] sm:p-6">
            <PackageCheck size={24} className="text-[#F2C303]" /><p className="mt-5 text-xs font-bold uppercase text-[#F2C303]">Quantity protection</p><h2 className="mt-2 text-xl font-bold">No quantity can be sold twice</h2><p className="mt-3 text-sm leading-6 text-[#FFFFFF]/65">Accepting this offer reserves the full declared quantity. Conflicting offers remain unavailable until the reservation is released.</p>
            <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs text-white/50">Available quantity</p><p className="mt-1 text-2xl font-bold">220 kg</p></div>
          </aside>
        </div>
        <div className="mt-6"><DemoNotice>Demo offer and terms. No real buyer or payment is connected.</DemoNotice></div>
      </div>

      {confirming && <div className="fixed inset-0 z-50 grid place-items-center bg-[#004A25]/55 p-4" role="dialog" aria-modal="true" aria-labelledby="offer-confirm-title"><div className="w-full max-w-md bg-white p-6 shadow-2xl"><ShieldCheck size={28} className="text-[#76AC3C]" /><h2 id="offer-confirm-title" className="mt-4 text-xl font-bold">Accept this offer?</h2><p className="mt-2 text-sm leading-6 text-[#3E594B]">This reserves all 220 kg for FreshLink Kisii at KSh 18.18/kg. The agreed quantity cannot be accepted by another buyer.</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setConfirming(false)} className="h-11 flex-1 rounded-lg border border-[#004A25]/15 text-sm font-bold">Cancel</button><button type="button" onClick={accept} className="h-11 flex-1 rounded-lg bg-[#004A25] text-sm font-bold text-white">Confirm acceptance</button></div></div></div>}
    </AppShell>
  );
}
