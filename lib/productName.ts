import { brandPrefixLength } from './brandMatch';

/**
 * Splits a Sheet product name ("BAOVICTO DOUBLE SIDED WOOL ZIP UP JACKET")
 * into its brand and item parts for display: the brand comes from
 * brands.json (longest matching leading name wins, so "Bevan Up" beats a
 * hypothetical "Bevan"), and the item name drops out of ALL CAPS into
 * title case ("Double Sided Wool Zip Up Jacket"), which is far easier to scan.
 *
 * A name whose brand isn't in brands.json keeps no brand and is just
 * title-cased whole.
 */
export interface NameParts {
  brand?: string;
  brandSlug?: string;
  itemName: string;
}

/**
 * Capitalises the first letter of every word, including after a hyphen or
 * slash ("t-shirt" -> "T-Shirt"). ALL-CAPS names are lowered first. A word
 * that already has a capital in it is left as typed (e.g. "iPhone", "NFC"
 * inside a hand-cased name).
 */
export function titleCase(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return t;
  const base = t === t.toUpperCase() ? t.toLowerCase() : t;
  return base.replace(/[\p{L}\p{N}'’]+/gu, (word) =>
    /\p{Lu}/u.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
  );
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
  if (!best) return { itemName: titleCase(name) };

  const rest = name.trim().slice(best.len).replace(/^[\s\-–—:|]+/, '');
  return {
    brand: best.brandName,
    brandSlug: best.slug,
    // A listing that is only the brand name falls back to the full name.
    itemName: titleCase(rest || name),
  };
}
