import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Stars from '@/components/Stars';
import Stamp from '@/components/Stamp';
import Reveal from '@/components/Reveal';
import ProductImage from '@/components/ProductImage';
import PerforatedDivider from '@/components/PerforatedDivider';
import WishlistButton from '@/components/WishlistButton';
import { trackBuyClick } from '@/lib/tracking';
import { productMatchesBrand } from '@/lib/brandMatch';
import { loadProducts, type Product } from '@/lib/products';
import { CANONICAL_ORIGIN } from '@/lib/siteUrl';

type Category = 'fashion' | 'tech';

type RelatedProduct = Pick<Product, 'id' | 'name' | 'image' | 'category' | 'price'>;

interface Brand {
  brandName: string;
  slug: string;
}

interface Props {
  product: Product | null;
  more: RelatedProduct[];
  matchedBrand: Brand | null;
  cat: Category;
}

// Rendered on the server so crawlers and link previews get the product's own
// title, description, canonical and structured data in the HTML, and so an
// unknown id is a real 404 rather than a 200 with a "not found" message.
export const getServerSideProps: GetServerSideProps<Props> = async ({ params, query, res }) => {
  const id = String(params?.id ?? '');
  const cat: Category = query.category === 'tech' ? 'tech' : 'fashion';
  const empty: Props = { product: null, more: [], matchedBrand: null, cat };

  const { products, source } = await loadProducts(cat);

  // The Sheet couldn't be read, so we can't tell whether this product exists.
  // Say "temporarily unavailable" rather than 404ing (or showing the demo
  // item for) a real product. Local dev without Sheet credentials still gets
  // the demo catalogue.
  if (source === 'demo' && process.env.NODE_ENV === 'production') {
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    return { props: empty };
  }

  const product = products.find((p) => p.id === id);
  if (!product) {
    res.statusCode = 404;
    return { props: empty };
  }

  const brands: Brand[] = (await import('../../public/data/brands.json')).default;
  const brand = brands.find((b) => productMatchesBrand(product.name, b.brandName));

  // Ranks candidates instead of a strict same-category filter, so a Stussy
  // hoodie can surface a Stussy tee (shared brand) or another streetwear
  // pullover (shared style tags) rather than only exact same-category items.
  // Same-category alone still scores > 0, so this is a strict broadening of
  // the old filter, never a narrowing.
  const styleTags = new Set(product.manualStyleTags || []);
  const more = products
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (p.category === product.category) score += 3;
      score += (p.manualStyleTags || []).filter((t) => styleTags.has(t)).length * 2;
      if (brand && productMatchesBrand(p.name, brand.brandName)) score += 4;
      if (product.manualFit && p.manualFit === product.manualFit) score += 1;
      return { product: p, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ product: p }) => ({ id: p.id, name: p.name, image: p.image, category: p.category, price: p.price }));

  // Same window as /api/products. Nothing here is per-user (the wishlist
  // state loads client-side), so the CDN can share one copy.
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  return {
    props: {
      // Round-trip drops `undefined` optionals, which Next refuses to serialise.
      product: JSON.parse(JSON.stringify(product)),
      more,
      matchedBrand: brand ? { brandName: brand.brandName, slug: brand.slug } : null,
      cat,
    },
  };
};

export default function ProductPage({ product, more, matchedBrand, cat }: Props) {
  const trackClick = async () => {
    if (!product) return;
    const eventId = trackBuyClick({ productId: product.id, productName: product.name });
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, productName: product.name, type: 'product-click', eventId }),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  if (!product) {
    return (
      <>
        <Head>
          <title>Product not found — RAPID Marketplace</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="container-edit py-24 text-center">
          <p className="text-ink/70 mb-6">We couldn&apos;t find that product — it may have sold out or moved.</p>
          <Link
            href={cat === 'tech' ? '/tech-listings' : '/fashion-listings'}
            className="link-underline font-mono text-xs uppercase tracking-wide"
          >
            Browse all listings →
          </Link>
        </div>
      </>
    );
  }

  // Fashion and tech ids overlap, so a tech product is only addressable with
  // its ?category=tech; fashion is the default and canonicalises without it.
  const canonical = `${CANONICAL_ORIGIN}/product/${encodeURIComponent(product.id)}${cat === 'tech' ? '?category=tech' : ''}`;

  return (
    <>
      <Head>
        <title>{`${product.name} — RAPID Marketplace`}</title>
        <meta name="description" content={product.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${product.name} — RAPID`} key="og:title" />
        <meta property="og:description" content={product.description} key="og:description" />
        <meta property="og:url" content={canonical} key="og:url" />
        {product.image && <meta property="og:image" content={product.image} key="og:image" />}
        {product.image && <meta property="og:image:alt" content={product.name} key="og:image:alt" />}
        <meta name="twitter:title" content={`${product.name} — RAPID`} />
        <meta name="twitter:description" content={product.description} />
        {product.image && <meta name="twitter:image" content={product.image} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Product',
              name: product.name,
              description: product.description,
              ...(product.image && { image: product.image }),
              url: canonical,
              offers: {
                '@type': 'Offer',
                price: product.price.replace(/[^0-9.]/g, ''),
                priceCurrency: 'AUD',
                url: product.sugargooLink,
              },
            }).replace(/</g, '\\u003c'),
          }}
        />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <Link
          href={cat === 'tech' ? '/tech-listings' : '/fashion-listings'}
          className="link-underline font-mono text-xs uppercase tracking-wide"
        >
          ← {cat === 'tech' ? 'Tech' : 'Fashion'} index
        </Link>

        <Reveal className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] bg-paper border border-line overflow-hidden">
              {/* LCP for this route — eager + high priority. */}
              <ProductImage src={product.image} alt={product.name} variant="detail" priority />
            </div>
            {product.verified && (
              <div className="absolute -top-4 -left-4 hidden sm:block">
                <Stamp size={84} centerText="QC" sub="Passed" ringText="Quality Checked · Verified Seller ·" spin={false} />
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                {product.category}
              </span>
              {matchedBrand && (
                <>
                  <span className="text-muted/50" aria-hidden="true">·</span>
                  <Link
                    href={`/brands/${matchedBrand.slug}`}
                    className="link-underline font-mono text-[11px] uppercase tracking-wide"
                  >
                    {matchedBrand.brandName}
                  </Link>
                </>
              )}
            </div>
            <h1 className="font-display font-black text-ink text-3xl md:text-4xl tracking-tightest leading-[1.05] mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-2.5 mb-6">
              <Stars rating={4.8} size={15} />
              <span className="font-mono text-xs text-muted">4.8 average seller rating</span>
            </div>

            <p className="text-lg text-ink/75 leading-relaxed mb-8 max-w-md">{product.description}</p>

            <p className="font-mono text-3xl text-ink mb-1.5">{product.price}</p>
            <p className="text-xs text-muted mb-8">Item price — Sugargoo shipping &amp; fees are calculated separately at checkout.</p>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <a
                href={product.sugargooLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackClick}
                className="btn-stamp w-full sm:w-auto !px-10"
              >
                Buy on Sugargoo →
              </a>
              <WishlistButton productId={product.id} category={cat} showLabel />
            </div>

            <div className="border-t border-line pt-6 space-y-3">
              <p className="text-sm text-ink/70 leading-relaxed">
                This listing ships from its seller to the Sugargoo warehouse for QC
                and consolidation, then on to your door.{' '}
                <a
                  href={product.sugargooLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackClick}
                  className="link-underline font-semibold"
                >
                  See full reviews on Sugargoo →
                </a>
              </p>
              <Link href="/tutorial" className="link-underline font-mono text-xs uppercase tracking-wide inline-block">
                How ordering works →
              </Link>
            </div>
          </div>
        </Reveal>

        {more.length > 0 && (
          <>
            <PerforatedDivider className="mt-24" />
            <Reveal as="section" className="pt-14">
            <h2 className="font-display font-black text-2xl md:text-3xl tracking-tightest mb-10">
              You might also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-10">
              {more.map((p) => (
                <Link key={p.id} href={`/product/${p.id}?category=${cat}`} className="flex flex-col group">
                  <div className="aspect-[4/5] bg-paper border border-line overflow-hidden mb-3">
                    <ProductImage src={p.image} alt={p.name} />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1 block">
                    {p.category}
                  </span>
                  <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-stamp transition-colors">
                    {p.name}
                  </h3>
                  <span className="font-mono text-sm">{p.price}</span>
                </Link>
              ))}
            </div>
            </Reveal>
          </>
        )}
      </div>
    </>
  );
}
