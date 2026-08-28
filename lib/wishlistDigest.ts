/**
 * Picks products "similar to" a user's wishlist for the wishlist-digest email
 * automation. Reuses the same brand-resolution and aesthetic-tag vocabulary as
 * lib/styleMatch.ts (matchProducts) rather than reinventing scoring — here the
 * "quiz answers" are implicit: the aesthetic tags of the wishlisted items'
 * brands, not a form the user filled in.
 */
import { productMatchesBrand } from './brandMatch';

export interface DigestProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  sugargooLink: string;
  category: string;
}

export interface DigestBrand {
  brandName: string;
  slug: string;
  aesthetic: string[];
}

export interface WishlistItem {
  product_id: string;
  category: string;
}

function findBrandForProduct(product: DigestProduct, brands: DigestBrand[]): DigestBrand | undefined {
  return brands.find((b) => productMatchesBrand(product.name, b.brandName));
}

/**
 * Scores each non-wishlisted product by aesthetic-tag overlap with the brands
 * behind the user's wishlisted items, and returns the top `limit`. A product
 * with no resolvable brand (not in brands.json) can't be scored and is
 * excluded, same as the "no brand match" case in matchProducts.
 *
 * Callers pass `allProducts` already scoped to the one catalog (fashion/tech)
 * matching `wishlist`'s items — wishlist_items.category is that catalog name
 * ("fashion"/"tech"), a different namespace from DigestProduct.category
 * (products.ts's granular "Jackets"/"Pants"/etc.), so matching is by
 * product id alone rather than a combined category+id key.
 */
export function pickSimilarProducts(
  wishlist: WishlistItem[],
  allProducts: DigestProduct[],
  brands: DigestBrand[],
  limit = 4
): DigestProduct[] {
  const wishlistedIds = new Set(wishlist.map((w) => w.product_id));
  const wishlistedProducts = allProducts.filter((p) => wishlistedIds.has(p.id));
  if (wishlistedProducts.length === 0) return [];

  const seedTags = new Set<string>();
  for (const product of wishlistedProducts) {
    const brand = findBrandForProduct(product, brands);
    brand?.aesthetic.forEach((tag) => seedTags.add(tag.toLowerCase()));
  }
  if (seedTags.size === 0) return [];

  const candidates = allProducts.filter((p) => !wishlistedIds.has(p.id));

  const scored = candidates
    .map((product) => {
      const brand = findBrandForProduct(product, brands);
      const overlap = brand ? brand.aesthetic.filter((tag) => seedTags.has(tag.toLowerCase())).length : 0;
      return { product, overlap };
    })
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap);

  return scored.slice(0, limit).map((s) => s.product);
}
