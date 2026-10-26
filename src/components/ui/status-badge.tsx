import { cn } from '@/lib/utils';

const styles = {
  draft: 'border-[#3E594B]/20 bg-white text-[#3E594B]',
  submitted: 'border-[#B5A45C]/30 bg-[#FFF4C5] text-[#004A25]',
  assessed: 'border-[#76AC3C]/25 bg-[#EDF5DF] text-[#004A25]',
  listed: 'border-[#3E594B]/25 bg-[#EAF0E8] text-[#004A25]',
  offer_pending: 'border-[#76AC3C]/25 bg-[#FFF4C5] text-[#004A25]',
  reserved: 'border-[#76AC3C]/25 bg-[#EDF5DF] text-[#004A25]',
  sold: 'border-[#76AC3C]/25 bg-[#004A25] text-white',
  collected: 'border-[#76AC3C]/25 bg-[#EDF5DF] text-[#004A25]',
  completed: 'border-[#76AC3C]/25 bg-[#004A25] text-white',
  cancelled: 'border-[#3E594B]/20 bg-[#F2F4F0] text-[#3E594B]',
} as const;

const labels = {
  draft: 'Draft',
  submitted: 'Submitted',
  assessed: 'Assessment ready',
  listed: 'Listed',
  offer_pending: 'Offer pending',
  reserved: 'Reserved',
  sold: 'Sold',
  collected: 'Collected',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

export type HarvestStatus = keyof typeof styles;

export function StatusBadge({ status }: { status: HarvestStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', styles[status])}>
      {labels[status]}
    </span>
  );
}
