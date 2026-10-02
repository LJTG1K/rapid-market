// Products from the live site's own /api/products (read-only), used for
// brand match counts and the Gilly's Picks preview. Going through the site
// means Studio sees exactly the catalog the site renders. Product editing
// (v1 slice 3) will talk to the Sheet directly.
const SITE = (process.env.STUDIO_SITE_URL || 'https://www.rapid.market').replace(/\/$/, '');
const CATEGORIES = ['fashion', 'tech'] as const;
const TTL_MS = 5 * 60_000;

// The site answers with a single hardcoded demo product when the Sheet is
// unreachable. Treat that as "no data", not as a one-product catalog.
const DEMO_NAME = 'Premium White Cotton Tee';

export interface ProductSummary {
  id: string;
  name: string;
  image: string;
  price: string;
  category: (typeof CATEGORIES)[number];
}

let cache: { at: number; products: ProductSummary[] } | null = null;

export async function getProducts(): Promise<{ products: ProductSummary[]; available: boolean }> {
  if (cache && Date.now() - cache.at < TTL_MS) return { products: cache.products, available: true };
  try {
    const lists = await Promise.all(
      CATEGORIES.map(async (category) => {
        const res = await fetch(`${SITE}/api/products?category=${category}`, { signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new Error(`${res.status}`);
        const items: Partial<ProductSummary>[] = await res.json();
        if (items.length === 1 && items[0].name === DEMO_NAME) throw new Error('demo fallback');
        return items
          .filter((p) => p.name)
          .map((p) => ({ id: String(p.id ?? ''), name: p.name!, image: p.image ?? '', price: p.price ?? '', category }));
      }),
    );
    cache = { at: Date.now(), products: lists.flat() };
    return { products: cache.products, available: true };
  } catch (e) {
    console.warn('[studio] product feed unavailable:', (e as Error).message);
    return { products: cache?.products ?? [], available: !!cache };
  }
}
