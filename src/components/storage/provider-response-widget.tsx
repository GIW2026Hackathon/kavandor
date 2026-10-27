'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, DollarSign, MessageSquare, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface ProviderResponseWidgetProps {
  requestId: string;
  initialStatus: string;
  initialQuoteAmount?: number | null;
  initialQuoteNotes?: string | null;
  initialProviderNotes?: string | null;
  userRole?: string;
}

export function ProviderResponseWidget({
  requestId,
  initialStatus,
  initialQuoteAmount,
  initialQuoteNotes,
  initialProviderNotes,
  userRole = 'farmer',
}: ProviderResponseWidgetProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [quoteAmount, setQuoteAmount] = useState(initialQuoteAmount ? String(initialQuoteAmount) : '');
  const [providerNotes, setProviderNotes] = useState(initialProviderNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOperator = userRole === 'facility_operator' || userRole === 'operations_admin';

  const handleUpdate = async (nextStatus: 'confirmed' | 'quoted' | 'released') => {
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const res = await fetch(`/api/reservations/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          quoteAmount: quoteAmount ? Number(quoteAmount) : undefined,
          providerNotes: providerNotes || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to update request');
      }

      setStatus(nextStatus);
      setFeedback(
        nextStatus === 'confirmed'
          ? 'Capacity allocated and request confirmed successfully!'
          : 'Quote & operational response submitted to farmer.'
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E2DED6] bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#E2DED6] pb-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
            Provider Lifecycle &amp; Quoting
          </span>
          <h3 className="text-lg font-bold text-[#17191D]">Request Status &amp; Response</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            status === 'confirmed'
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-800'
              : status === 'quoted'
                ? 'border border-sky-300 bg-sky-50 text-sky-800'
                : 'border border-amber-300 bg-amber-50 text-amber-800'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Display quote and notes if present */}
      {(initialQuoteAmount || quoteAmount || initialProviderNotes || providerNotes) && (
        <div className="mt-4 space-y-3 rounded-xl bg-[#FAF9F5] border border-[#E2DED6] p-4 text-xs">
          {(initialQuoteAmount || quoteAmount) && (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#74767B] flex items-center gap-1.5">
                <DollarSign size={14} className="text-[#008765]" /> Provider Tariff / Quote:
              </span>
              <span className="font-mono font-bold text-sm text-[#17191D]">
                {formatCurrency(Number(quoteAmount || initialQuoteAmount))}
              </span>
            </div>
          )}

          {(initialProviderNotes || providerNotes) && (
            <div className="border-t border-[#E2DED6] pt-2">
              <p className="font-semibold text-[#74767B] flex items-center gap-1.5">
                <MessageSquare size={14} className="text-[#FF5A1F]" /> Operator Intake Instructions:
              </p>
              <p className="mt-1 text-neutral-800 leading-relaxed font-sans">
                {providerNotes || initialProviderNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Provider / Operator Response Form */}
      {isOperator && status !== 'completed' && status !== 'released' && (
        <div className="mt-5 space-y-4 border-t border-[#E2DED6] pt-4">
          <p className="text-xs font-bold text-[#17191D]">
            Provider Actions ({userRole.replace('_', ' ')})
          </p>

          <label className="block text-xs font-semibold text-[#74767B]">
            Service Tariff / Quote Amount (KES)
            <input
              type="number"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="e.g. 1100"
              className="mt-1 block w-full rounded-xl border border-[#E2DED6] px-3 py-2 text-sm text-[#17191D] outline-none focus:border-[#FF5A1F]"
            />
          </label>

          <label className="block text-xs font-semibold text-[#74767B]">
            Operator Intake Notes / Instructions
            <textarea
              rows={2}
              value={providerNotes}
              onChange={(e) => setProviderNotes(e.target.value)}
              placeholder="e.g. Bring produce in plastic crates. Digital scale inspection bay 2."
              className="mt-1 block w-full rounded-xl border border-[#E2DED6] px-3 py-2 text-sm text-[#17191D] outline-none focus:border-[#FF5A1F]"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleUpdate('confirmed')}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#00C896] hover:bg-[#00A87D] px-4 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Confirm &amp; Allocate Capacity
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleUpdate('quoted')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2DED6] bg-white px-4 text-xs font-bold text-[#17191D] hover:bg-[#FAF9F5] shadow-2xs transition disabled:opacity-50"
            >
              Submit Quote
            </button>
          </div>
        </div>
      )}

      {/* If farmer is viewing a confirmed status */}
      {!isOperator && status === 'confirmed' && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-800">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            Provider has confirmed capacity and approved your intake slot. Follow instructions upon arrival.
          </span>
        </div>
      )}

      {feedback && (
        <p className="mt-3 text-xs font-semibold text-emerald-700">{feedback}</p>
      )}

      {error && (
        <p className="mt-3 text-xs font-semibold text-rose-700">{error}</p>
      )}
    </div>
  );
}
