function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const pattern = new RegExp(`^${escapeRegExp(brandName.trim())}\\b`, 'i');
  return pattern.test(productName.trim());
}
