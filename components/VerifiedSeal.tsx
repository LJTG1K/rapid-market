/**
 * The "Verified seller" seal on product cards. The stamp motif shrunk to a
 * functional trust badge. It claims only what's true for every indexed item:
 * the seller is one RAPID has vetted. It never says "QC passed" (QC happens
 * at the warehouse after purchase). Green appears only here.
 */
export default function VerifiedSeal({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-white/95 text-ink rounded-full pl-1.5 pr-2.5 py-1 font-mono text-[10px] uppercase tracking-wide shadow-[0_1px_2px_rgba(14,14,16,0.08)] ${className}`}
    >
      <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="5.5" className="fill-qc" />
        <path d="M3.4 6.1l1.7 1.7 3.5-3.6" stroke="#fff" strokeWidth="1.4" fill="none" />
      </svg>
      Verified seller
    </span>
  );
}
