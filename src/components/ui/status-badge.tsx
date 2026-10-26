import { cn } from '@/lib/utils';

const styles = {
  draft: 'border-[#E2DED6] bg-[#FAF9F5] text-[#74767B]',
  submitted: 'border-[#F0B34D]/40 bg-[#FFF8E7] text-[#B45309]',
  assessed: 'border-[#00C896]/30 bg-[#E6F9F4] text-[#008765]',
  listed: 'border-[#426E8C]/30 bg-[#EDF4F9] text-[#2C526D]',
  offer_pending: 'border-[#FF5A1F]/30 bg-[#FFF0EB] text-[#FF5A1F] font-bold',
  reserved: 'border-[#F0B34D]/40 bg-[#FFF8E7] text-[#B45309]',
  sold: 'border-[#17191D] bg-[#17191D] text-white',
  collected: 'border-[#00C896]/30 bg-[#E6F9F4] text-[#008765]',
  completed: 'border-[#17191D] bg-[#17191D] text-white',
  cancelled: 'border-[#DC2626]/30 bg-[#FEF2F2] text-[#DC2626]',
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
