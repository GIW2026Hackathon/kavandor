export function KavandorLogo({
  className = '',
  iconSize = 28,
  showText = true,
  textColor = 'text-white',
}: {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  textColor?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Bespoke unboxed dual-leaf organic sprout mark */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 group-hover:scale-105"
        aria-hidden="true"
      >
        {/* Primary ascending leaf in Electric Orange */}
        <path
          d="M6 26C6 26 8 16 17 10C24.5 5 27 5 27 5C27 5 26.5 9.5 22.5 16C18.5 22.5 11 25.5 6 26Z"
          fill="#FF5A1F"
        />
        {/* Secondary emergent leaf with subtle warm glow */}
        <path
          d="M14 24.5C14 24.5 15.5 18 21 14C24.5 11.5 26 11 26 11C26 11 25.5 13.8 23 17.5C20.5 21.2 16.5 23.8 14 24.5Z"
          fill="#FF7A45"
          fillOpacity="0.88"
        />
        {/* Delicate stem vein accent */}
        <path
          d="M7 25C9.5 23.5 14 20.5 17 17"
          stroke="#FFFFFF"
          strokeOpacity="0.45"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className={`text-xl font-black tracking-tight ${textColor}`}>
          KAVANDOR<span className="text-[#FF5A1F]">.</span>
        </span>
      )}
    </div>
  );
}
