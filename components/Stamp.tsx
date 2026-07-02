interface StampProps {
  ringText?: string;
  centerText?: string;
  sub?: string;
  size?: number;
  spin?: boolean;
  className?: string;
}

/**
 * The site's signature mark: a customs/QC ink-stamp — the one real artifact
 * of the Sugargoo flow (every haul is photographed and approved before it ships).
 * Reused wherever something has been checked/verified rather than as decoration.
 */
export default function Stamp({
  ringText = 'QUALITY CHECKED · VERIFIED SELLER ·',
  centerText = 'QC',
  sub = 'PASSED',
  size = 128,
  spin = true,
  className = '',
}: StampProps) {
  const id = `stamp-ring-${centerText}-${sub}`.replace(/\s+/g, '-').toLowerCase();
  const r = 46;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 text-stamp ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={spin ? 'motion-safe:animate-[spin_16s_linear_infinite]' : ''}
        aria-hidden="true"
      >
        <path
          id={id}
          d={`M 50 50 m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`}
          fill="none"
        />
        <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="1 3.4" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" />
        <text fontSize="7.4" letterSpacing="2.5" fill="currentColor" fontFamily="'IBM Plex Mono', monospace">
          <textPath href={`#${id}`} startOffset="0%">
            {ringText}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        <span className="font-display font-black" style={{ fontSize: size * 0.22 }}>
          {centerText}
        </span>
        <span className="font-mono uppercase tracking-widest" style={{ fontSize: size * 0.07, marginTop: size * 0.03 }}>
          {sub}
        </span>
      </div>
    </div>
  );
}
