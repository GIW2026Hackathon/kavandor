import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { QuantityDisplay } from '@/components/ui/quantity-display';
import { StatusBadge, type HarvestStatus } from '@/components/ui/status-badge';

export function HarvestCard({
  crop,
  quantity,
  unit,
  harvestDate,
  location,
  status,
  action,
  href,
}: {
  crop: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  location: string;
  status: HarvestStatus;
  action: string;
  href: string;
}) {
  return (
    <article className="flex flex-col justify-between border-b border-[#E2DED6] py-5 first:pt-0 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <StatusBadge status={status} />
          <h3 className="mt-3 text-xl font-bold text-[#17191D]">{crop}</h3>
          <p className="mt-1 text-sm text-[#74767B]">Harvested {harvestDate}</p>
        </div>
        <QuantityDisplay quantity={quantity} unit={unit} />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs text-[#74767B]">
          <MapPin size={14} /> {location}
        </span>
        <Link href={href} className="flex items-center gap-1 text-sm font-bold text-[#FF5A1F] hover:text-[#E44E18] transition-colors">
          {action} <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
