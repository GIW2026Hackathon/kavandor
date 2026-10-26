export function QuantityDisplay({ quantity, unit, size = 'base' }: { quantity: number; unit: string; size?: 'small' | 'base' }) {
  return (
    <p className={`shrink-0 text-right ${size === 'small' ? 'text-base' : 'text-2xl'} font-bold text-[#17191D]`}>
      {quantity.toLocaleString()} <span className="text-sm font-semibold text-[#74767B]">{unit}</span>
    </p>
  );
}
