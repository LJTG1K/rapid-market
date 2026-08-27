/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // No `domains`/`remotePatterns` on purpose. next/image is used only with
    // local files under public/assets; remote product photographs are resized
    // by the seller's own CDN (see lib/cdnImage.ts) rather than by Vercel's
    // optimizer, which is metered per unique source image and would be
    // expensive across a ~1000-product catalogue.
    formats: ['image/avif', 'image/webp'],
    // Capped at 1920: the largest local source is hero-main at 1632px wide and
    // Next never upscales, so 2048/3840 candidates would resolve to identical
    // pixels — wasted srcSet entries and wasted optimizer cache entries.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  compress: true,
  poweredByHeader: false,
  headers: async () => [
    {
      // Next serves public/ with `max-age=0` by default, so every repeat visit
      // pays a conditional request per asset. These filenames aren't
      // content-hashed, so this is deliberately not `immutable` — a re-encode
      // still reaches users within a week.
      source: '/assets/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=604800, stale-while-revalidate=2592000',
        },
      ],
    },
    // NOTE: /api/products sets its own Cache-Control in the handler
    // (pages/api/products.ts), varying by NODE_ENV. The duplicate rule that
    // used to live here disagreed with it on stale-while-revalidate.
  ],
};

module.exports = nextConfig;
