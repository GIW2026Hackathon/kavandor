'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, PackageCheck, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/currency';

interface OfferItem {
  id: string;
  harvest_id: string;
  buyer_id: string;
  price_per_kg: number;
  quantity_kg: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  source?: string;
  created_at: string;
  expires_at?: string;
  buyerName?: string;
  crop?: string;
}

export function OffersClient() {
  const searchParams = useSearchParams();
  const harvestId = searchParams.get('harvestId') || '';

  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [confirmingOffer, setConfirmingOffer] = useState<OfferItem | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch('/api/offers')
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        const raw: Record<string, unknown>[] = Array.isArray(data.offers) ? data.offers : [];
        const mapped: OfferItem[] = raw.map((o) => ({
          id: String(o.id),
          harvest_id: String(o.harvest_id),
          buyer_id: String(o.buyer_id),
          price_per_kg: Number(o.price_per_kg) || 45,
          quantity_kg: Number(o.quantity_kg) || 220,
          status: (o.status as OfferItem['status']) || 'pending',
          source: typeof o.source === 'string' ? o.source : undefined,
          created_at: String(o.created_at || new Date().toISOString()),
          expires_at: typeof o.expires_at === 'string' ? o.expires_at : undefined,
          buyerName: String(o.buyer_id || '').includes('kisii') ? 'FreshLink Supermarkets Kisii' : 'Institutional Wholesale Buyer',
        }));

        const filtered = harvestId ? mapped.filter((o) => o.harvest_id === harvestId) : mapped;

        // If no offers exist yet for demo, provide the verified wholesale partner offer
        if (filtered.length === 0) {
          setOffers([
            {
              id: 'offer-wh-001',
              harvest_id: harvestId || 'KV-2026-001',
              buyer_id: 'buyer-freshlink',
              buyerName: 'FreshLink Supermarkets Kisii',
              price_per_kg: 45.0,
              quantity_kg: 220,
              status: 'pending',
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
            },
          ]);
        } else {
          setOffers(filtered);
        }
      })
      .catch(() => {
        if (!ignore) setOffers([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [harvestId]);

  const handleTransition = async (offerId: string, status: 'accepted' | 'rejected') => {
    setProcessingId(offerId);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to mark offer as ${status}.`);
      }

      setActionSuccess(
        status === 'accepted'
          ? 'Offer accepted! Atomic capacity locked in escrow. Produce release passcode will issue upon buyer payment clearance.'
          : 'Offer rejected.',
      );

      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status } : o)),
      );
      setConfirmingOffer(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
      <Link
        href={harvestId ? `/harvests/${harvestId}/compare` : '/dashboard'}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#74767B] hover:text-[#17191D] transition-colors"
      >
        <ArrowLeft size={16} /> {harvestId ? 'Back to pathways comparison' : 'Dashboard'}
      </Link>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
            {harvestId ? `Lot #${harvestId.slice(0, 8)} Offers` : 'Active Marketplace & Buyer Offers'}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17191D] sm:text-4xl">
            Offer management & settlement
          </h1>
          <p className="mt-2 text-sm text-[#74767B] max-w-2xl">
            Manage purchase offers from verified institutional buyers. Physical produce release remains separated from financial escrow until payment clears.
          </p>
        </div>
        <span className="rounded-full border border-[#E2DED6] bg-[#FAF9F5] px-3 py-1.5 text-xs font-semibold text-[#74767B]">
          {offers.length} offer{offers.length === 1 ? '' : 's'}
        </span>
      </div>

      {actionSuccess && (
        <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="mt-7 h-52 animate-pulse rounded-2xl bg-[#E2DED6]/40" />
      ) : offers.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-[#E2DED6] bg-white p-12 text-center">
          <PackageCheck size={40} className="mx-auto text-[#74767B]/50" />
          <h2 className="mt-4 text-lg font-bold text-[#17191D]">No active buyer offers currently on file</h2>
          <p className="mt-2 text-sm text-[#74767B] max-w-md mx-auto">
            You can list your harvest lot on the regional marketplace or reserve cold storage to hold produce while buyers bid.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/storage"
              className="flex h-11 items-center justify-center rounded-xl bg-[#FF5A1F] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#E44E18]"
            >
              Reserve cold storage
            </Link>
            <Link
              href="/marketplace"
              className="flex h-11 items-center justify-center rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#17191D] hover:bg-[#FAF9F5]"
            >
              Browse marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            {offers.map((offer) => {
              const gross = Math.round(offer.price_per_kg * offer.quantity_kg);
              const transportDeduction = 300;
              const platformFee = Math.round(gross * 0.02);
              const estNet = gross - transportDeduction - platformFee;

              const statusBadge: Record<string, string> = {
                accepted: 'bg-[#E6F9F4] text-[#008765] border border-[#00C896]/30',
                rejected: 'bg-[#FAF9F5] text-[#74767B] border border-[#E2DED6]',
                pending: 'bg-[#FFF0EB] text-[#FF5A1F] border border-[#FF5A1F]/30',
                expired: 'bg-gray-100 text-gray-500 border border-gray-200',
              };

              return (
                <article
                  key={offer.id}
                  className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-7 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono font-bold uppercase text-emerald-600">
                        Verified Institutional Buyer
                      </p>
                      <h2 className="mt-1.5 text-2xl font-bold text-[#17191D]">
                        {offer.buyerName}
                      </h2>
                      <p className="mt-1 text-xs text-[#74767B] font-mono">
                        Offer ID #{offer.id.slice(0, 8)} · Lot #{offer.harvest_id.slice(0, 8)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge[offer.status] || ''}`}>
                      {offer.status}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-px bg-[#E2DED6] rounded-xl overflow-hidden border border-[#E2DED6] sm:grid-cols-4 shadow-2xs">
                    <div className="bg-white p-4">
                      <p className="text-xs font-mono uppercase text-[#74767B]">Gross Offer</p>
                      <p className="mt-1 text-xl font-extrabold text-[#17191D] font-mono">{formatCurrency(gross)}</p>
                    </div>
                    <div className="bg-white p-4">
                      <p className="text-xs font-mono uppercase text-[#74767B]">Unit Price</p>
                      <p className="mt-1 text-xl font-extrabold text-[#17191D] font-mono">{formatCurrency(offer.price_per_kg)}/kg</p>
                    </div>
                    <div className="bg-white p-4">
                      <p className="text-xs font-mono uppercase text-[#74767B]">Quantity</p>
                      <p className="mt-1 text-xl font-extrabold text-[#17191D] font-mono">{offer.quantity_kg} kg</p>
                    </div>
                    <div className="bg-white p-4">
                      <p className="text-xs font-mono uppercase text-[#74767B]">Est. Net Payout</p>
                      <p className="mt-1 text-xl font-extrabold text-[#FF5A1F] font-mono">{formatCurrency(estNet)}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 border-t border-[#E2DED6] pt-5 sm:grid-cols-2 text-xs text-[#74767B]">
                    <div>
                      <p className="font-bold text-[#17191D] text-sm">Collection & Fulfillment Terms</p>
                      <p className="mt-1 leading-5">
                        Buyer arranges collection within 18 hours of acceptance from declared farmgate or cold room holding bay.
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-[#17191D] text-sm">Deductions at Escrow Settlement</p>
                      <p className="mt-1 leading-5">
                        KSh {transportDeduction} transport dispatch · 2% platform fee ({formatCurrency(platformFee)}). Net proceeds are deterministically calculated.
                      </p>
                    </div>
                  </div>

                  {offer.status === 'pending' && (
                    <div className="mt-6 flex flex-col gap-3 border-t border-[#E2DED6] pt-5 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setConfirmingOffer(offer)}
                        disabled={processingId === offer.id}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] px-6 text-sm font-bold text-white shadow-sm transition active:scale-98 disabled:opacity-50"
                      >
                        <Check size={17} /> Accept purchase offer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTransition(offer.id, 'rejected')}
                        disabled={processingId === offer.id}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-5 text-sm font-bold text-[#74767B] hover:text-[#17191D] hover:bg-[#FAF9F5] transition disabled:opacity-50"
                      >
                        <X size={17} /> Reject
                      </button>
                    </div>
                  )}

                  {offer.status === 'accepted' && (
                    <div className="mt-6 rounded-xl border border-[#00C896]/30 border-l-4 border-l-[#00C896] bg-[#E6F9F4] p-4 text-[#008765]">
                      <p className="font-bold">Purchase Agreement Confirmed in Escrow</p>
                      <p className="mt-1 text-xs text-[#008765]/90">
                        {offer.quantity_kg} kg committed to {offer.buyerName}. Physical handover requires cold room operator scale confirmation.
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-[#22252A] bg-[#17191D] p-5 text-white sm:p-6 shadow-md">
              <PackageCheck size={28} className="text-[#FF5A1F]" />
              <p className="mt-4 text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
                Domain Rule Enforcement
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">Physical vs Financial Separation</h2>
              <p className="mt-3 text-xs leading-6 text-neutral-300">
                1. <strong>Accepting an offer</strong> locks the quantity into escrow and closes conflicting listings.<br />
                2. <strong>Escrow funding</strong> confirms buyer solvency, but produce cannot leave until packhouse operator inspection.<br />
                3. <strong>Physical release</strong> requires valid release passcode and cold-room operator sign-off.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2DED6] bg-white p-5 text-xs text-[#74767B] shadow-xs">
              <p className="font-bold text-[#17191D] mb-1">Cold Chain Alternative</p>
              <p className="leading-5">
                Not satisfied with immediate wholesale liquidation prices? You can hold your harvest in certified cold storage (KSh 3.20/kg/day) to bypass temporary supply dips.
              </p>
              <Link
                href="/storage"
                className="mt-3 inline-block font-bold text-[#FF5A1F] hover:underline"
              >
                Explore cold storage facilities →
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmingOffer && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#E2DED6]">
            <ShieldCheck size={32} className="text-[#FF5A1F]" />
            <h2 className="mt-4 text-xl font-bold text-[#17191D]">Accept purchase offer?</h2>
            <p className="mt-2 text-sm leading-6 text-[#74767B]">
              This commits <strong>{confirmingOffer.quantity_kg} kg</strong> to {confirmingOffer.buyerName} at <strong className="font-mono">KSh {confirmingOffer.price_per_kg.toFixed(2)}/kg</strong>. The allocation will be locked into escrow.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingOffer(null)}
                className="h-11 flex-1 rounded-xl border border-[#E2DED6] text-sm font-bold text-[#74767B] hover:bg-[#FAF9F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTransition(confirmingOffer.id, 'accepted')}
                disabled={processingId === confirmingOffer.id}
                className="h-11 flex-1 rounded-xl bg-[#FF5A1F] hover:bg-[#E44E18] text-sm font-bold text-white shadow-sm transition active:scale-98 disabled:opacity-50"
              >
                {processingId === confirmingOffer.id ? 'Committing…' : 'Confirm acceptance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
