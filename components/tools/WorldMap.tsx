import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SHIPPING_WEIGHT_BUCKETS, type CountrySummary } from '@/lib/shipping/types';

interface WorldPaths {
  viewBox: string;
  paths: Record<string, string>;
}

interface WorldMapProps {
  countries: CountrySummary[];
  selectedIso: string;
  onSelect: (iso2: string) => void;
  weightGrams: number;
  className?: string;
}

/** Literal Tailwind classes — tailwind.config.js only scans ./pages/** and
 *  ./components/**, so a computed/templated class string here would be
 *  purged in production while still working in dev. Cheap (accent) to
 *  expensive (stamp); a 6th class covers "no data yet". */
const BANDS = [
  'fill-accent/70',
  'fill-accent/45',
  'fill-accent/25',
  'fill-stamp/25',
  'fill-stamp/50',
] as const;
const NO_DATA_FILL = 'fill-line/40';
const SELECTED_STROKE = 'stroke-ink';

function nearestBucket(weightGrams: number): (typeof SHIPPING_WEIGHT_BUCKETS)[number] {
  let best: (typeof SHIPPING_WEIGHT_BUCKETS)[number] = SHIPPING_WEIGHT_BUCKETS[0];
  let bestDiff = Infinity;
  for (const b of SHIPPING_WEIGHT_BUCKETS) {
    const diff = Math.abs(b - weightGrams);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = b;
    }
  }
  return best;
}

/** Splits countries-with-data into 5 roughly-equal price bands (quantiles). */
function buildBandLookup(countries: CountrySummary[], bucket: number): Map<string, number> {
  const priced = countries
    .map((c) => ({ iso2: c.iso2, price: c.cheapestUsdByWeight?.[String(bucket) as '500'] ?? null }))
    .filter((c): c is { iso2: string; price: number } => c.price != null)
    .sort((a, b) => a.price - b.price);

  const lookup = new Map<string, number>();
  if (priced.length === 0) return lookup;

  const bandCount = BANDS.length;
  priced.forEach((c, i) => {
    const band = Math.min(bandCount - 1, Math.floor((i / priced.length) * bandCount));
    lookup.set(c.iso2, band);
  });
  return lookup;
}

export default function WorldMap({ countries, selectedIso, onSelect, weightGrams, className = '' }: WorldMapProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [world, setWorld] = useState<WorldPaths | null>(null);
  const [hoveredIso, setHoveredIso] = useState<string | null>(null);

  useEffect(() => {
    if (!isDesktop || world) return;
    fetch('/data/shipping/world-paths.json')
      .then((r) => r.json())
      .then(setWorld)
      .catch(() => {
        /* Map is a progressive enhancement — the <select> above always
           works, so a failed fetch here is silently non-fatal. */
      });
  }, [isDesktop, world]);

  if (!isDesktop) return null;

  const dataByIso = new Map(countries.map((c) => [c.iso2, c]));
  const bucket = nearestBucket(weightGrams);
  const bandLookup = buildBandLookup(countries, bucket);
  const hovered = hoveredIso ? dataByIso.get(hoveredIso) : null;

  return (
    <div className={className}>
      {!world ? (
        <div className="aspect-[960/500] border border-line bg-paper animate-pulse" aria-hidden="true" />
      ) : (
        <div className="relative">
          <svg
            viewBox={world.viewBox}
            role="img"
            aria-label="World map — click a coloured country to see its Sugargoo shipping lines. Use the destination country list above for the same selection."
            className="w-full h-auto border border-line bg-paper"
          >
            {Object.entries(world.paths).map(([iso2, d]) => {
              const country = dataByIso.get(iso2);
              const hasData = !!country && country.lineCount > 0;
              const band = bandLookup.get(iso2);
              const fill = hasData && band != null ? BANDS[band] : NO_DATA_FILL;
              const isSelected = iso2 === selectedIso;

              return (
                <path
                  key={iso2}
                  d={d}
                  className={`${fill} stroke-line transition-colors ${
                    isSelected ? `${SELECTED_STROKE} stroke-2` : 'stroke-[0.5]'
                  } ${hasData ? 'cursor-pointer hover:fill-ink/80' : 'cursor-default'}`}
                  onClick={hasData ? () => onSelect(iso2) : undefined}
                  onMouseEnter={() => setHoveredIso(iso2)}
                  onMouseLeave={() => setHoveredIso((prev) => (prev === iso2 ? null : prev))}
                >
                  {country && <title>{country.name}{hasData ? ' — click to select' : ' — no data yet'}</title>}
                </path>
              );
            })}
          </svg>

          {hovered && (
            <div className="absolute bottom-3 left-3 bg-ink text-paper px-3 py-2 text-xs font-mono pointer-events-none">
              {hovered.name}
              {hovered.lineCount > 0 ? ` — ${hovered.lineCount} lines` : ' — no data yet'}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 flex-wrap text-xs font-mono uppercase tracking-wide text-muted">
        <span>Cheaper</span>
        {BANDS.map((cls, i) => (
          <span key={i} className={`w-4 h-4 inline-block border border-line ${cls}`} />
        ))}
        <span>Pricier</span>
        <span className={`w-4 h-4 inline-block border border-line ${NO_DATA_FILL} ml-3`} />
        <span>No data yet</span>
      </div>
    </div>
  );
}
