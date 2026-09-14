function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Every caller re-checks the same handful of brand names against many
// products (a brand page filters its whole catalog by one brand; the style
// quiz and the fashion-listings picks shelf check every untagged product
// against the full ~170-brand list). Compiling a RegExp is the expensive
// part, so cache one per brand name instead of rebuilding it on every call —
// same result, but a brand's pattern is now compiled once total instead of
// once per product.
const patternCache = new Map<string, RegExp>();

function getBrandPattern(brandName: string): RegExp {
  const trimmed = brandName.trim();
  let pattern = patternCache.get(trimmed);
  if (!pattern) {
    pattern = new RegExp(`^${escapeRegExp(trimmed)}\\b`, 'i');
    patternCache.set(trimmed, pattern);
  }
  return pattern;
}

/**
 * Seller listings follow a "BRAND ITEM DESCRIPTION" naming convention
 * (e.g. "BEVAN UP CURVED ZIPPER JACKET"), so a brand only counts as a match
 * if its name is the leading word(s) of the product title — not just any
 * substring. A plain `.includes()` false-matches short brand names against
 * unrelated words (e.g. brand "NIN" inside product "NINE ...") and
 * dictionary-word brand names (e.g. "Original", "Riot") against ordinary
 * marketing copy anywhere in the name or description.
 */
export function productMatchesBrand(productName: string, brandName: string): boolean {
  return getBrandPattern(brandName).test(productName.trim());
}
