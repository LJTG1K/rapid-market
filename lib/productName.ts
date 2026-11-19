import { brandPrefixLength } from './brandMatch';

/**
 * Splits a Sheet product name ("BAOVICTO DOUBLE SIDED WOOL ZIP UP JACKET")
 * into its brand and item parts for display: the brand comes from
 * brands.json (longest matching leading name wins, so "Bevan Up" beats a
 * hypothetical "Bevan"), and the item name drops out of ALL CAPS into
 * sentence case, which is far easier to scan in a grid.
 *
 * A name whose brand isn't in brands.json keeps no brand and is just
 * sentence-cased whole.
 */
export interface NameParts {
  brand?: string;
  brandSlug?: string;
  itemName: string;
}

export function sentenceCase(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return t;
  // Only rewrite names that are shouting; leave hand-cased names alone.
  if (t !== t.toUpperCase()) return t;
  const lower = t.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function splitProductName(
  name: string,
  brands: { brandName: string; slug: string }[]
): NameParts {
  let best: { brandName: string; slug: string; len: number } | null = null;
  for (const b of brands) {
    const len = brandPrefixLength(name, b.brandName);
    if (len !== null && (!best || len > best.len)) best = { ...b, len };
  }
  if (!best) return { itemName: sentenceCase(name) };

  const rest = name.trim().slice(best.len).replace(/^[\s\-–—:|]+/, '');
  return {
    brand: best.brandName,
    brandSlug: best.slug,
    // A listing that is only the brand name falls back to the full name.
    itemName: sentenceCase(rest || name),
  };
}
