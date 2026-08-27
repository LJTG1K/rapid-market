interface ShippingDisclaimerProps {
  lastVerified: string;
  className?: string;
}

const STALE_AFTER_DAYS = 90;

function daysSince(dateStr: string): number {
  const then = new Date(dateStr + 'T00:00:00Z').getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

/**
 * Sits above the fold on the shipping tool (never buried in a footer) and
 * is reused verbatim on the future per-country pages. The stale-data
 * warning is the single most load-bearing few lines in this feature — see
 * the "misleading pricing" risk in the shipping-tool plan.
 */
export default function ShippingDisclaimer({ lastVerified, className = '' }: ShippingDisclaimerProps) {
  const stale = daysSince(lastVerified) > STALE_AFTER_DAYS;

  return (
    <div className={`border border-line bg-paper px-4 py-3 text-xs text-muted leading-relaxed ${className}`}>
      <p>
        <span className="font-mono uppercase tracking-wide text-ink">Estimates only</span> — rates last verified{' '}
        <span className="text-ink">{lastVerified}</span>. Compiled from Sugargoo&apos;s own published shipping
        calculator; not affiliated with or guaranteed by Sugargoo. Excludes tariffs, duties, VAT, and Sugargoo
        service fees. Always confirm the final price at checkout before paying.
      </p>
      {stale && (
        <p className="mt-2 text-stamp font-semibold">
          These rates are more than {STALE_AFTER_DAYS} days old and may no longer be accurate.
        </p>
      )}
    </div>
  );
}
