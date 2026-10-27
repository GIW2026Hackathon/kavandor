'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import type { ClarificationQuestion } from '@/lib/value-addition-engine';

interface ClarificationWidgetProps {
  harvestId: string;
  questions: ClarificationQuestion[];
  existingAnswers?: Record<string, string>;
  onAnswersSaved?: (newAnswers: Record<string, string>) => void;
}

export function ClarificationWidget({
  harvestId,
  questions,
  existingAnswers = {},
  onAnswersSaved,
}: ClarificationWidgetProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { ...existingAnswers };
    for (const q of questions) {
      if (q.answered && !initial[q.id]) {
        initial[q.id] = q.answered;
      }
    }
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const hasSelections = Object.keys(answers).length > 0;
  const allAnswered = questions.every((q) => Boolean(answers[q.id]));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/harvests/${harvestId}/clarify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update clarification answers');
      }

      setSuccessMessage('Pathway recommendations re-evaluated with your farmgate inputs!');
      if (onAnswersSaved) {
        onAnswersSaved(answers);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting answers';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border-2 border-[#FF5A1F]/30 bg-gradient-to-br from-[#FFF8F5] to-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[#FF5A1F]">
          <HelpCircle size={22} className="shrink-0" />
          <h2 className="text-lg font-extrabold text-[#17191D]">
            Clarification Needed for Highest-Value Pathways
          </h2>
        </div>
        <span className="self-start rounded-full bg-[#FF5A1F]/10 px-3 py-1 text-xs font-mono font-bold text-[#FF5A1F]">
          {Object.keys(answers).length} of {questions.length} Clarified
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-[#74767B]">
        Agronomic AI and economic pathways adjust based on harvest condition and timing. Answering these targeted questions refines eligibility, reduces risk, and unlocks accurate quotes.
      </p>

      <div className="mt-5 space-y-6">
        {questions.map((q, idx) => {
          const selected = answers[q.id];
          return (
            <div
              key={q.id}
              className="rounded-xl border border-[#E2DED6] bg-white p-4 transition-colors hover:border-[#FF5A1F]/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF5A1F]">
                    Question {idx + 1}
                  </span>
                  <p className="mt-0.5 text-sm font-bold text-[#17191D]">{q.question}</p>
                </div>
                {selected && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 size={13} /> Selected
                  </span>
                )}
              </div>

              <div className="mt-2 text-xs text-[#74767B] bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2DED6]/60">
                <p>
                  <strong className="text-[#17191D]">Context:</strong> {q.context}
                </p>
                <p className="mt-1 text-[#FF5A1F]">
                  <strong>Material Impact:</strong> {q.materialImpact}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const isOptSelected = selected === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelect(q.id, opt)}
                      className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        isOptSelected
                          ? 'bg-[#FF5A1F] text-white shadow-xs'
                          : 'border border-[#E2DED6] bg-white text-[#17191D] hover:bg-[#FAF9F5] hover:border-[#74767B]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between pt-2 border-t border-[#FF5A1F]/20">
        <p className="text-xs text-[#74767B]">
          {allAnswered
            ? 'All questions answered! Click below to apply.'
            : 'Select answers to update decision rankings.'}
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasSelections || isSubmitting}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5A1F] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#E44E18] disabled:opacity-50 disabled:pointer-events-none active:scale-98"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Re-ranking Pathways...
            </>
          ) : (
            <>
              Update Decision Pathways <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
