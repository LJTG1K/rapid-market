/**
 * Shipping Line Finder — shared types.
 *
 * Rates are a committed static artifact (see public/data/shipping/), never a
 * live call to an agent's API. Everything here mirrors that JSON shape.
 */

/** Raw agent prices are stored in USD — confirmed against Sugargoo's own
 *  freight-estimate calculator, which returns totals in USD regardless of
 *  destination country (not the destination's local currency, and not
 *  CNY) — and converted for display via `FxSnapshot`. Storing a second,
 *  independently-rounded display-currency figure per line would drift
 *  from the source and double the transcription work at data-entry time. */
export type RateCurrency = 'USD';

export interface FxSnapshot {
  /** USD, always — see RateCurrency above. */
  base: RateCurrency;
  /** 'YYYY-MM-DD' the rates were snapshotted, independent of per-line lastVerified. */
  asOf: string;
  /** Units of `code` per 1 USD, e.g. { GBP: 0.79, AUD: 1.52, EUR: 0.92 }. */
  rates: Record<string, number>;
}

export interface CountrySummary {
  /** ISO 3166-1 alpha-2, uppercase. Primary key everywhere. */
  iso2: string;
  name: string;
  /** URL slug for the future /tools/shipping/[country] pages, e.g. 'australia'. */
  slug: string;
  /** ISO 4217 display currency for this country, e.g. 'AUD'. Must exist in FxSnapshot.rates. */
  currency: string;
  /** Grouping used by the mobile <select>, e.g. 'Oceania', 'North America'. */
  region: string;
  lineCount: number;
  /** Cheapest total USD price at fixed weight buckets, for choropleth colouring
   *  without loading every country's line file. null = no data for this country yet. */
  cheapestUsdByWeight: Record<'500' | '1000' | '2000' | '5000' | '10000', number> | null;
  /** Fastest line's minDays, or null if no line has known delivery days. */
  fastestDays: number | null;
}

export interface ShippingIndex {
  schemaVersion: 1;
  /** 'YYYY-MM-DD' — the most recent per-country lastVerified across the whole dataset. */
  lastVerified: string;
  sourceNote: string;
  fx: FxSnapshot;
  countries: CountrySummary[];
}

/** The weight buckets CountrySummary.cheapestCnyByWeight is keyed by.
 *  Must match WEIGHT_BUCKETS in scripts/build-shipping-index.mjs — that
 *  script can't import this .ts file directly, so the two are kept in sync
 *  by hand; a mismatch would only show up as a wrong choropleth bucket
 *  pick, not a type error. */
export const SHIPPING_WEIGHT_BUCKETS = [500, 1000, 2000, 5000, 10000] as const;

export type BillingBasis = 'actual' | 'volumetric' | 'greater';

export interface ShippingLinePricing {
  currency: RateCurrency;
  /** Grams covered by firstWeightPrice. Not assumed to be 500 — read per line. */
  firstWeightGrams: number;
  firstWeightPrice: number;
  /** Grams per continuedWeightPrice increment beyond firstWeightGrams. */
  continuedWeightGrams: number;
  continuedWeightPrice: number;
  /** Flat add-on (fuel/remote-area/operation fee), USD. */
  surchargeFlat?: number;
}

export interface ShippingLineBilling {
  basis: BillingBasis;
  /** cm^3 per kg used to derive volumetric weight. Sugargoo lines are typically 6000 or 8000. */
  volumetricDivisor: number;
}

export interface ShippingLineLimits {
  minWeightGrams?: number;
  maxWeightGrams?: number;
  maxSingleSideCm?: number;
  /** Length + width + height, cm. */
  maxGirthCm?: number;
}

export interface ShippingLine {
  /** Stable, agent-prefixed id, e.g. 'sugargoo-au-sea'. */
  id: string;
  /** Present from day one so other agents are additive, not a schema break. */
  agent: 'sugargoo';
  /** The route name/code as Sugargoo displays it, e.g. 'AU-SEA'. */
  name: string;
  pricing: ShippingLinePricing;
  billing: ShippingLineBilling;
  limits: ShippingLineLimits;
  delivery: { minDays: number; maxDays: number } | null;
  characteristics: string[];
  restrictions: string[];
  notes?: string;
}

export interface CountryLines {
  iso2: string;
  /** May differ from ShippingIndex.lastVerified if this country was checked separately. */
  lastVerified: string;
  lines: ShippingLine[];
}
