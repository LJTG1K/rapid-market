import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProducts } from '../../lib/products';
import { CANONICAL_ORIGIN as BASE_URL } from '../../lib/siteUrl';

interface Entry {
  path: string;
  priority: string;
  changefreq: string;
}

// Indexable static routes only. Left out on purpose: /campaign and /reddit
// (noindex ad landers), /login, /account, and the landing-page tests.
const STATIC_PAGES: Entry[] = [
  { path: '', priority: '1.0', changefreq: 'daily' },
  { path: '/fashion-listings', priority: '0.9', changefreq: 'daily' },
  { path: '/tech-listings', priority: '0.9', changefreq: 'daily' },
  { path: '/gillys-picks', priority: '0.8', changefreq: 'weekly' },
  { path: '/brands', priority: '0.9', changefreq: 'weekly' },
  { path: '/blog', priority: '0.7', changefreq: 'weekly' },
  { path: '/style-quiz', priority: '0.7', changefreq: 'monthly' },
  { path: '/tutorial', priority: '0.7', changefreq: 'monthly' },
  { path: '/tools', priority: '0.7', changefreq: 'monthly' },
  { path: '/tools/shipping', priority: '0.9', changefreq: 'monthly' },
  { path: '/signup', priority: '0.6', changefreq: 'monthly' },
];

function urlTag({ path, priority, changefreq }: Entry) {
  return `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>`;
}

function generateSiteMap(entries: Entry[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(urlTag).join('')}
</urlset>`;
}

async function fetchJson(path: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`${path} responded ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`${path} did not return an array`);
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [fashion, tech, brands, posts] = await Promise.all([
      loadProducts('fashion'),
      loadProducts('tech'),
      fetchJson('/data/brands.json'),
      fetchJson('/data/blog-posts.json'),
    ]);

    // Fashion and tech ids overlap, so tech products are only addressable with
    // ?category=tech — the same URL pages/product/[id].tsx declares canonical.
    // A catalogue that fell back to demo data contributes nothing.
    const productEntries = (catalogue: typeof fashion, suffix: string): Entry[] =>
      catalogue.source === 'sheet'
        ? catalogue.products.map((p) => ({
            path: `/product/${encodeURIComponent(p.id)}${suffix}`,
            priority: '0.8',
            changefreq: 'weekly',
          }))
        : [];

    // Rows without the field a URL is built from are skipped rather than
    // emitted as ".../undefined".
    const entries: Entry[] = [
      ...STATIC_PAGES,
      ...productEntries(fashion, ''),
      ...productEntries(tech, '?category=tech'),
      ...brands
        .filter((b) => b?.slug)
        .map((b) => ({ path: `/brands/${encodeURIComponent(b.slug)}`, priority: '0.7', changefreq: 'weekly' })),
      ...posts
        .filter((p) => p?.slug)
        .map((p) => ({ path: `/blog/${encodeURIComponent(p.slug)}`, priority: '0.6', changefreq: 'monthly' })),
    ];

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate');
    res.write(generateSiteMap(entries));
    res.end();
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).end('Sitemap generation failed');
  }
}
