import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProducts, type Product } from '../../lib/products';

// The catalogue itself (Sheet parsing, categorising, warm-instance cache)
// lives in lib/products.ts so server-rendered pages can share it.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Product[]>
) {
  const category = (req.query.category as string) || 'fashion';
  const cacheTime = process.env.NODE_ENV === 'production' ? 3600 : 300;

  const { products, source } = await loadProducts(category);

  // Only real Sheet data is CDN-cacheable — the demo fallback must not be
  // pinned at the edge for an hour after a transient Sheets failure.
  if (source === 'sheet') {
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`
    );
  }

  res.status(200).json(products);
}
