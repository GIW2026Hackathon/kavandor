export function QuantityDisplay({ quantity, unit, size = 'base' }: { quantity: number; unit: string; size?: 'small' | 'base' }) {
  return (
    <p className={`shrink-0 text-right ${size === 'small' ? 'text-base' : 'text-2xl'} font-bold text-[#004A25]`}>
      {quantity.toLocaleString()} <span className="text-sm font-semibold text-[#3E594B]">{unit}</span>
    </p>
  );
}
