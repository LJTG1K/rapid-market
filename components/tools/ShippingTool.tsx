import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { ShippingIndex, CountryLines } from '@/lib/shipping/types';
import type { ParcelInput as ParcelInputValue } from '@/lib/shipping/pricing';
import { fetchCountryLines } from '@/lib/shipping/loadCountry';
import ParcelInput from './ParcelInput';
import ShippingLineTable from './ShippingLineTable';
import ShippingDisclaimer from './ShippingDisclaimer';
import WorldMap from './WorldMap';

const DEFAULT_PARCEL: ParcelInputValue = { weightGrams: 2500, lengthCm: 40, widthCm: 30, heightCm: 25 };

interface ShippingToolProps {
  index: ShippingIndex;
  /** Pre-selects a country — the seam the future /tools/shipping/[country]
   *  pages hook into, so v1.1 renders this same component server-rendered
   *  with lines already loaded rather than requiring a rewrite. */
  initialIso?: string;
  preloadedLines?: CountryLines;
}

export default function ShippingTool({ index, initialIso, preloadedLines }: ShippingToolProps) {
  const router = useRouter();
  const countries = index.countries;

  const [selectedIso, setSelectedIso] = useState<string>(
    initialIso ?? (typeof router.query.country === 'string' ? router.query.country.toUpperCase() : countries[0]?.iso2 ?? '')
  );
  const [countryLines, setCountryLines] = useState<CountryLines | null>(preloadedLines ?? null);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [parcel, setParcel] = useState<ParcelInputValue>(DEFAULT_PARCEL);

  // Pick up ?country= on first load (e.g. shared Discord links), once the router is ready.
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.country;
    if (typeof q === 'string' && q.toUpperCase() !== selectedIso) {
      setSelectedIso(q.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Keep the URL in sync so the tool is shareable, without adding history entries.
  useEffect(() => {
    if (!router.isReady || !selectedIso) return;
    if (router.query.country === selectedIso) return;
    router.replace({ pathname: router.pathname, query: { ...router.query, country: selectedIso } }, undefined, {
      shallow: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIso, router.isReady]);

  useEffect(() => {
    if (!selectedIso) return;
    if (countryLines?.iso2 === selectedIso) return;

    setLoadingLines(true);
    setLoadError(null);
    fetchCountryLines(selectedIso)
      .then(setCountryLines)
      .catch(() => setLoadError('Could not load rates for this country.'))
      .finally(() => setLoadingLines(false));
  }, [selectedIso, countryLines]);

  const selectedCountry = countries.find((c) => c.iso2 === selectedIso);
  const regions = Array.from(new Set(countries.map((c) => c.region))).sort();

  return (
    <div>
      <WorldMap
        countries={countries}
        selectedIso={selectedIso}
        onSelect={setSelectedIso}
        weightGrams={parcel.weightGrams}
        className="mb-10"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 mb-10">
        <div className="lg:col-span-1">
          <label htmlFor="country-select" className="eyebrow block mb-2">
            Destination country <span className="normal-case text-muted">(or choose from the list)</span>
          </label>
          <select
            id="country-select"
            value={selectedIso}
            onChange={(e) => setSelectedIso(e.target.value)}
            className="w-full px-3 py-2.5 bg-paper border border-line focus:outline-none focus:border-ink text-sm mb-6"
          >
            {regions.map((region) => (
              <optgroup key={region} label={region}>
                {countries
                  .filter((c) => c.region === region)
                  .map((c) => (
                    <option key={c.iso2} value={c.iso2}>
                      {c.name} {c.lineCount === 0 ? '(no data yet)' : ''}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>

          <ParcelInput value={parcel} onChange={setParcel} />
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display font-black text-2xl md:text-3xl tracking-tightest">
              {selectedCountry?.name ?? 'Select a country'}
            </h2>
            {selectedCountry && (
              <span className="eyebrow">{countryLines?.lines.length ?? selectedCountry.lineCount} lines</span>
            )}
          </div>

          {loadingLines && <p className="font-mono text-sm text-muted py-8">Loading rates…</p>}
          {loadError && <p className="font-mono text-sm text-stamp py-8">{loadError}</p>}
          {!loadingLines && !loadError && countryLines && countryLines.iso2 === selectedIso && (
            <ShippingLineTable
              lines={countryLines.lines}
              parcel={parcel}
              currency={selectedCountry?.currency ?? 'USD'}
              fx={index.fx}
            />
          )}
        </div>
      </div>

      <ShippingDisclaimer lastVerified={countryLines?.lastVerified ?? index.lastVerified} />
    </div>
  );
}
