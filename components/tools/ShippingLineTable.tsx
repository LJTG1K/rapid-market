import { useMemo, useState } from 'react';
import type { ShippingLine, FxSnapshot } from '@/lib/shipping/types';
import type { ParcelInput } from '@/lib/shipping/pricing';
import { quoteAll, convert, formatMoney, type Quote } from '@/lib/shipping/pricing';

type SortKey = 'price' | 'speed' | 'value';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'price', label: 'Cheapest' },
  { key: 'speed', label: 'Fastest' },
  { key: 'value', label: 'Best value (per kg)' },
];

interface ShippingLineTableProps {
  lines: ShippingLine[];
  parcel: ParcelInput;
  currency: string;
  fx: FxSnapshot;
  className?: string;
}

function displayPrice(usd: number, currency: string, fx: FxSnapshot): string {
  return formatMoney(convert(usd, currency, fx), currency);
}

function deliveryLabel(q: Quote): string {
  if (!q.ok) return '—';
  if (q.minDays == null) return 'Unknown';
  return q.minDays === q.maxDays ? `${q.minDays} days` : `${q.minDays}–${q.maxDays} days`;
}

export default function ShippingLineTable({ lines, parcel, currency, fx, className = '' }: ShippingLineTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('price');

  const { ok, failed } = useMemo(() => {
    const quotes = quoteAll(lines, parcel);
    const paired = quotes.map((q, i) => ({ line: lines[i], quote: q }));
    const ok = paired.filter((p): p is { line: ShippingLine; quote: Quote & { ok: true } } => p.quote.ok);
    const failed = paired.filter((p) => !p.quote.ok);

    ok.sort((a, b) => {
      if (sortKey === 'price') return a.quote.totalUsd - b.quote.totalUsd;
      if (sortKey === 'value') return a.quote.usdPerKg - b.quote.usdPerKg;
      // speed: unknown delivery time sorts last
      const aDays = a.quote.minDays ?? Infinity;
      const bDays = b.quote.minDays ?? Infinity;
      return aDays - bDays;
    });

    return { ok, failed };
  }, [lines, parcel, sortKey]);

  if (lines.length === 0) {
    return (
      <div className={`border border-line bg-paper px-6 py-10 text-center ${className}`}>
        <p className="font-mono text-sm text-muted">No Sugargoo lines on file for this country yet.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="eyebrow mr-1">Sort</span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSortKey(s.key)}
            className={`font-mono text-xs uppercase tracking-wide px-3 py-1.5 border transition-colors ${
              sortKey === s.key
                ? 'bg-ink text-paper border-ink'
                : 'border-line text-ink/70 hover:text-ink hover:border-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper">
              <th className="text-left font-mono text-xs uppercase tracking-wide text-muted px-4 py-3">Line</th>
              <th className="text-left font-mono text-xs uppercase tracking-wide text-muted px-4 py-3">Basis</th>
              <th className="text-left font-mono text-xs uppercase tracking-wide text-muted px-4 py-3">Delivery</th>
              <th className="text-right font-mono text-xs uppercase tracking-wide text-muted px-4 py-3">Price</th>
              <th className="text-left font-mono text-xs uppercase tracking-wide text-muted px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ok.map(({ line, quote }) => (
              <tr key={line.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3 font-semibold text-ink">{line.name}</td>
                <td className="px-4 py-3 text-ink/70 capitalize">{line.billing.basis}</td>
                <td className="px-4 py-3 text-ink/70">{deliveryLabel(quote)}</td>
                <td className="px-4 py-3 text-right font-mono text-ink">
                  {displayPrice(quote.totalUsd, currency, fx)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {line.characteristics.map((c) => (
                      <span key={c} className="tag !bg-transparent !text-accent !border-accent">{c}</span>
                    ))}
                    {line.restrictions.map((r) => (
                      <span key={r} className="font-mono text-[11px] uppercase tracking-wide text-stamp">
                        ⚠ {r}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {failed.map(({ line, quote }) => (
              <tr key={line.id} className="border-b border-line last:border-b-0 opacity-40">
                <td className="px-4 py-3 font-semibold text-ink">{line.name}</td>
                <td className="px-4 py-3 text-ink/70 capitalize">{line.billing.basis}</td>
                <td className="px-4 py-3 text-ink/70">—</td>
                <td className="px-4 py-3 text-right font-mono text-ink">Not available</td>
                <td className="px-4 py-3 text-xs text-muted">{!quote.ok && quote.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {ok.map(({ line, quote }) => (
          <div key={line.id} className="card p-4">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h4 className="font-display font-bold text-base">{line.name}</h4>
              <span className="font-mono text-lg text-ink shrink-0">
                {displayPrice(quote.totalUsd, currency, fx)}
              </span>
            </div>
            <p className="text-xs text-muted mb-2">
              {deliveryLabel(quote)} · {line.billing.basis} weight
            </p>
            <div className="flex flex-wrap gap-1.5">
              {line.characteristics.map((c) => (
                <span key={c} className="tag !bg-transparent !text-accent !border-accent">{c}</span>
              ))}
              {line.restrictions.map((r) => (
                <span key={r} className="font-mono text-[11px] uppercase tracking-wide text-stamp">⚠ {r}</span>
              ))}
            </div>
          </div>
        ))}
        {failed.map(({ line, quote }) => (
          <div key={line.id} className="card p-4 opacity-40">
            <h4 className="font-display font-bold text-base mb-1">{line.name}</h4>
            <p className="text-xs text-muted">{!quote.ok && quote.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
