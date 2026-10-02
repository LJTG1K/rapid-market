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

// Product names come from the Google Sheet, where a few sellers' names are
// misspelled on some rows. Rather than leave those listings orphaned from their
// brand page, each canonical brand (lowercase) also accepts its known
// misspellings as the leading word(s) of a title.
const BRAND_ALIASES: Record<string, string[]> = {
  antiphase: ['ANTIPHANSE'],
  beft: ['BFET'],
  pi0neer: ['PIONEER'],
  jcaesar: ['JCAESER', 'JCEASER', 'JCEASAR'],
};

function getBrandPattern(brandName: string): RegExp {
  const trimmed = brandName.trim();
  let pattern = patternCache.get(trimmed);
  if (!pattern) {
    const names = [trimmed, ...(BRAND_ALIASES[trimmed.toLowerCase()] ?? [])];
    pattern = new RegExp(`^(?:${names.map(escapeRegExp).join('|')})\\b`, 'i');
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
