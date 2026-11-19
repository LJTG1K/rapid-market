/**
 * Green verified tick shown next to a brand name: the seller is one RAPID has
 * vetted. Sits on the brand (the thing actually verified), not on the photo.
 * Green appears only on verification marks.
 */
export default function VerifiedTick({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-grid place-items-center w-[13px] h-[13px] rounded-full bg-qc shrink-0 ${className}`}
      title="Verified seller"
    >
      <svg width="8" height="8" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3 6.2l2 2 4-4.2" stroke="#fff" strokeWidth="1.8" fill="none" />
      </svg>
      <span className="sr-only">Verified seller</span>
    </span>
  );
}
