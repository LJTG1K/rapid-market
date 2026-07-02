import type { NextApiRequest, NextApiResponse } from 'next';

const BASE_URL = 'https://rapid.market';

function generateSiteMap(products: any[], brands: any[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Pages -->
  <url>
    <loc>${BASE_URL}</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${BASE_URL}/fashion-listings</loc>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${BASE_URL}/brands</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${BASE_URL}/tutorial</loc>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>${BASE_URL}/campaigns</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>
  <!-- Product Pages -->
  ${products
    .map(({ slug }: { slug: string }) => {
      return `
  <url>
    <loc>${BASE_URL}/fashion-listings/${slug}</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>`;
    })
    .join('')}
  <!-- Brand Pages -->
  ${brands
    .map(({ slug }: { slug: string }) => {
      return `
  <url>
    <loc>${BASE_URL}/brands/${slug}</loc>
    <priority>0.7</priority>
    <changefreq>weekly</changefreq>
  </url>`;
    })
    .join('')}
</urlset>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch products
    const productsRes = await fetch(`${BASE_URL}/api/products`);
    const products = await productsRes.json();

    // Fetch brands
    const brandsRes = await fetch(`${BASE_URL}/data/brands.json`);
    const brands = await brandsRes.json();

    // Generate sitemap
    const sitemap = generateSiteMap(products, brands);

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate');
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).end('Sitemap generation failed');
  }
}
