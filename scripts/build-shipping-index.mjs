#!/usr/bin/env node
/**
 * Builds public/data/shipping/index.json from the per-country files in
 * public/data/shipping/lines/. Run manually after editing rate data —
 * this never runs at request time (see AGENTS.md: Vercel functions freeze
 * right after the response is sent, so nothing here can run as a sync job).
 *
 * Mirrors the billable-weight math in lib/shipping/pricing.ts, but with no
 * box dimensions supplied. That means volumetric-basis lines can't be
 * priced (their volumetric weight is undefined without dimensions) and are
 * excluded from cheapestUsdByWeight — the bucket figures are a best-case
 * lower bound ("cheapest achievable"), not a quote. If you change the
 * rounding/billing logic in pricing.ts, update the mirror below to match.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINES_DIR = path.join(__dirname, '..', 'public', 'data', 'shipping', 'lines');
const INDEX_PATH = path.join(__dirname, '..', 'public', 'data', 'shipping', 'index.json');

const COUNTRY_META = {
  US: { name: 'United States', currency: 'USD', region: 'North America' },
  GB: { name: 'United Kingdom', currency: 'GBP', region: 'Europe' },
  AU: { name: 'Australia', currency: 'AUD', region: 'Oceania' },
  DE: { name: 'Germany', currency: 'EUR', region: 'Europe' },
  CA: { name: 'Canada', currency: 'CAD', region: 'North America' },
  JP: { name: 'Japan', currency: 'JPY', region: 'Asia' },
};

// Units of `code` per 1 USD (the storage currency — see RateCurrency in
// lib/shipping/types.ts). Approximate snapshot; refresh alongside rate data.
const FX_RATES = { GBP: 0.79, AUD: 1.52, EUR: 0.92, CAD: 1.37, JPY: 147 };
const FX_AS_OF = '2026-08-11';

const WEIGHT_BUCKETS = [500, 1000, 2000, 5000, 10000];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function cheapestAtWeight(lines, weightGrams) {
  let best = null;
  for (const line of lines) {
    if (line.billing.basis === 'volumetric') continue; // needs dimensions, not computable here
    const { minWeightGrams, maxWeightGrams } = line.limits;
    if (minWeightGrams != null && weightGrams < minWeightGrams) continue;
    if (maxWeightGrams != null && weightGrams > maxWeightGrams) continue;

    const { firstWeightGrams, firstWeightPrice, continuedWeightGrams, continuedWeightPrice, surchargeFlat } =
      line.pricing;
    const roundedUp = Math.ceil(weightGrams / continuedWeightGrams) * continuedWeightGrams;
    const chargeableGrams = Math.max(firstWeightGrams, roundedUp);
    const extraGrams = Math.max(0, chargeableGrams - firstWeightGrams);
    const increments = Math.ceil(extraGrams / continuedWeightGrams);
    const total = firstWeightPrice + increments * continuedWeightPrice + (surchargeFlat ?? 0);

    if (best == null || total < best) best = total;
  }
  return best;
}

function main() {
  const files = readdirSync(LINES_DIR).filter((f) => f.endsWith('.json'));
  const countries = [];
  let overallLastVerified = '1970-01-01';

  for (const file of files) {
    const iso2 = path.basename(file, '.json');
    const meta = COUNTRY_META[iso2];
    if (!meta) {
      throw new Error(`No COUNTRY_META entry for "${iso2}" — add one before building the index.`);
    }

    const raw = JSON.parse(readFileSync(path.join(LINES_DIR, file), 'utf8'));
    if (raw.lastVerified > overallLastVerified) overallLastVerified = raw.lastVerified;

    const cheapestUsdByWeight = {};
    for (const w of WEIGHT_BUCKETS) {
      cheapestUsdByWeight[String(w)] = cheapestAtWeight(raw.lines, w);
    }

    const daysKnown = raw.lines.map((l) => l.delivery?.minDays).filter((d) => typeof d === 'number');
    const fastestDays = daysKnown.length ? Math.min(...daysKnown) : null;

    countries.push({
      iso2,
      name: meta.name,
      slug: slugify(meta.name),
      currency: meta.currency,
      region: meta.region,
      lineCount: raw.lines.length,
      cheapestUsdByWeight,
      fastestDays,
    });
  }

  countries.sort((a, b) => a.name.localeCompare(b.name));

  const index = {
    schemaVersion: 1,
    lastVerified: overallLastVerified,
    sourceNote:
      'Mixed dataset in progress: AU is compiled from Sugargoo\'s own freight-estimate calculator; other countries are still placeholder MOCK figures pending compilation. See each line\'s notes for any inferred/approximated fields.',
    fx: { base: 'USD', asOf: FX_AS_OF, rates: FX_RATES },
    countries,
  };

  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n');
  console.log(`Wrote ${INDEX_PATH} with ${countries.length} countries.`);
}

main();
