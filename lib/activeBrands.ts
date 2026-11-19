/**
 * Which brands currently have at least one product in the catalogue. Brands
 * with zero products are hidden from the brand index, their brand page and
 * the sitemap, and reappear automatically once a product is added (their
 * brands.json entry is kept). Server-only.
 *
 * Returns null when the product feed couldn't be read (demo catalogue), so a
 * Sheets outage never hides every brand.
 */
import { loadProducts } from './products';
import { productMatchesBrand } from './brandMatch';

export async function loadActiveBrandNames(
  brands: { brandName: string }[]
): Promise<Set<string> | null> {
  const [fashion, tech] = await Promise.all([loadProducts('fashion'), loadProducts('tech')]);
  if (fashion.source !== 'sheet') return null;
  const products = [...fashion.products, ...(tech.source === 'sheet' ? tech.products : [])];
  return new Set(
    brands.filter((b) => products.some((p) => productMatchesBrand(p.name, b.brandName))).map((b) => b.brandName)
  );
}
