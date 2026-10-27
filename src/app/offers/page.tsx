'use client';

import Link from 'next/link';
import { ArrowLeft, Check, PackageCheck, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { activeWholesaleOffer } from '@/data/market';
import { formatCurrency } from '@/lib/currency';

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
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-[#74767B] hover:text-[#17191D] transition-colors">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Tomatoes · 220 kg · KV-2026-001</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">Offer management</h1>
          </div>
          <span className="rounded-full border border-[#E2DED6] bg-[#FAF9F5] px-3 py-1.5 text-xs font-semibold text-[#74767B]">1 offer</span>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">
          <article className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-7 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono font-bold uppercase text-emerald-600">Verified Institutional Buyer</p>
                <h2 className="mt-2 text-2xl font-bold text-[#17191D]">FreshLink Kisii</h2>
                <p className="mt-1 text-sm text-[#74767B]">Offer received 26 Oct · Expires {activeWholesaleOffer.expiresAt}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                decision === 'accepted'
                  ? 'bg-[#E6F9F4] text-[#008765] border border-[#00C896]/30'
                  : decision === 'rejected'
                  ? 'bg-[#FAF9F5] text-[#74767B] border border-[#E2DED6]'
                  : 'bg-[#FFF0EB] text-[#FF5A1F] border border-[#FF5A1F]/30'
              }`}>
                {decision === 'accepted' ? 'Accepted' : decision === 'rejected' ? 'Rejected' : 'Pending'}
              </span>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-px bg-[#E2DED6] rounded-xl overflow-hidden border border-[#E2DED6] sm:grid-cols-4 shadow-2xs">
              {[
                ['Total offer', formatCurrency(activeWholesaleOffer.amount)],
                ['Price unit', `${formatCurrency(activeWholesaleOffer.unitPrice)} / kg`],
                ['Quantity', `${activeWholesaleOffer.quantity} ${activeWholesaleOffer.unit}`],
                ['Net estimate', formatCurrency(activeWholesaleOffer.amount - 500)],
              ].map(([label, value]) => (
                <div key={label} className="bg-white p-4">
                  <p className="text-xs font-mono uppercase text-[#74767B]">{label}</p>
                  <p className="mt-2 text-xl font-extrabold text-[#17191D] font-mono">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 grid gap-5 border-t border-[#E2DED6] pt-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-[#17191D]">Collection terms</p>
                <p className="mt-2 text-sm leading-6 text-[#74767B]">Farmer to confirm collection point. Buyer arranges pickup within 18 hours of acceptance.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-[#17191D]">Deductions shown</p>
                <p className="mt-2 text-sm leading-6 text-[#74767B]">KSh 300 transport · KSh 200 handling. Net estimate excludes any unconfirmed charges.</p>
              </div>
            </div>

            {decision === 'pending' && (
              <div className="mt-7 flex flex-col gap-3 border-t border-[#E2DED6] pt-5 sm:flex-row">
                <button type="button" onClick={() => setConfirming(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-6 text-sm font-bold text-white shadow-sm transition active:scale-98">
                  <Check size={17} /> Accept offer
                </button>
                <button type="button" onClick={() => setDecision('rejected')} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#74767B] hover:text-[#17191D] hover:bg-[#FAF9F5] transition">
                  <X size={17} /> Reject
                </button>
              </div>
            )}
            {decision === 'accepted' && (
              <div className="mt-7 flex flex-col gap-4 rounded-xl border border-[#00C896]/30 border-l-4 border-l-[#00C896] bg-[#E6F9F4] p-4 text-[#008765] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">Agreement recorded</p>
                  <p className="mt-1 text-sm text-[#008765]/80">220 kg reserved for FreshLink Kisii.</p>
                </div>
                <Link href="/harvests/KV-2026-001/timeline" className="text-sm font-bold text-[#008765] underline underline-offset-4">
                  View traceability
                </Link>
              </div>
            )}
          </article>

          <aside className="rounded-2xl border border-[#22252A] bg-[#17191D] p-5 text-white sm:p-6 shadow-md">
            <PackageCheck size={28} className="text-[#FF5A1F]" />
            <p className="mt-5 text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">Quantity protection</p>
            <h2 className="mt-2 text-xl font-bold text-white">Atomic allocation guarantee</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              Accepting this offer locks the declared quantity into escrow. Conflicting purchase offers are automatically closed.
            </p>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs font-mono uppercase text-neutral-400">Available quantity</p>
              <p className="mt-1 text-2xl font-extrabold text-white font-mono">220 kg</p>
            </div>
          </aside>
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true" aria-labelledby="offer-confirm-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#E2DED6]">
            <ShieldCheck size={32} className="text-[#FF5A1F]" />
            <h2 id="offer-confirm-title" className="mt-4 text-xl font-bold text-[#17191D]">Accept this purchase offer?</h2>
            <p className="mt-2 text-sm leading-6 text-[#74767B]">
              This reserves all 220 kg for FreshLink Kisii at KSh 45.00/kg. The agreed quantity will be committed and cannot be accepted by another buyer.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setConfirming(false)} className="h-11 flex-1 rounded-xl border border-[#E2DED6] text-sm font-bold text-[#74767B] hover:bg-[#FAF9F5]">
                Cancel
              </button>
              <button type="button" onClick={accept} className="h-11 flex-1 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] text-sm font-bold text-white shadow-sm transition active:scale-98">
                Confirm acceptance
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
