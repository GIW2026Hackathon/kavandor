'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

export function ReAssessButton({ harvestId }: { harvestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReAssess = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`/api/harvests/${harvestId}/assess`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'AI assessment request could not be completed.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-run AI appraisal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleReAssess}
        disabled={loading}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#17191D] hover:bg-[#22252A] px-3.5 text-xs font-bold text-white shadow-sm transition active:scale-98 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin text-[#FF5A1F]" />
            Analyzing with Gemini…
          </>
        ) : success ? (
          <>
            <CheckCircle2 size={14} className="text-emerald-400" />
            Appraisal updated!
          </>
        ) : (
          <>
            <Sparkles size={14} className="text-[#FF5A1F]" />
            Re-run Gemini appraisal
          </>
        )}
      </button>
      {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}
