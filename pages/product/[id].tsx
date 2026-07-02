import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Stars from '@/components/Stars';
import Stamp from '@/components/Stamp';
import Reveal from '@/components/Reveal';

interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  sugargooLink: string;
  category: string;
  brand?: string;
  verified?: boolean;
}

export default function ProductPage() {
  const router = useRouter();
  const { id, category } = router.query;
  const cat = (category as string) || 'fashion';

  const [product, setProduct] = useState<Product | null>(null);
  const [more, setMore] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || !id) return;
    setLoading(true);
    fetch(`/api/products?category=${cat}`)
      .then((r) => r.json())
      .then((all: Product[]) => {
        const found = all.find((p) => p.id === id) || null;
        setProduct(found);
        if (found) {
          setMore(all.filter((p) => p.id !== found.id && p.category === found.category).slice(0, 3));
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [router.isReady, id, cat]);

  const trackClick = async () => {
    if (!product) return;
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, productName: product.name, type: 'product-click' }),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  if (loading) {
    return (
      <div className="container-edit py-12 md:py-16">
        <div className="h-3 w-28 bg-line/60 mb-8 motion-safe:animate-pulse" aria-hidden="true" />
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 motion-safe:animate-pulse" aria-hidden="true">
          <div className="aspect-square bg-paper border border-line" />
          <div>
            <div className="h-2.5 w-20 bg-line/60 mb-4" />
            <div className="h-8 w-full bg-line/60 mb-2" />
            <div className="h-8 w-2/3 bg-line/60 mb-6" />
            <div className="h-4 w-36 bg-line/60 mb-7" />
            <div className="h-4 w-full bg-line/60 mb-1.5" />
            <div className="h-4 w-4/5 bg-line/60 mb-8" />
            <div className="h-8 w-24 bg-line/60 mb-8" />
            <div className="h-12 w-44 bg-line/60" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-edit py-24 text-center">
        <p className="text-ink/70 mb-6">We couldn&apos;t find that product — it may have sold out or moved.</p>
        <Link href="/fashion-listings" className="link-underline font-mono text-xs uppercase tracking-wide">
          Browse all listings →
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} — RAPID Marketplace</title>
        <meta name="description" content={product.description} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Product',
              name: product.name,
              description: product.description,
              image: product.image,
              offers: {
                '@type': 'Offer',
                price: product.price.replace(/[^0-9.]/g, ''),
                priceCurrency: 'AUD',
                url: product.sugargooLink,
              },
            }),
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
            <div className="aspect-square bg-paper border border-line overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.verified && (
              <div className="absolute -top-4 -left-4 hidden sm:block">
                <Stamp size={84} centerText="QC" sub="Passed" ringText="Quality Checked · Verified Seller ·" spin={false} />
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted mb-3 block">
              {product.category}
            </span>
            <h1 className="font-display font-black text-ink text-3xl md:text-4xl tracking-tightest leading-[1.05] mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-2.5 mb-6">
              <Stars rating={4.8} size={15} />
              <span className="font-mono text-xs text-muted">4.8 average seller rating</span>
            </div>

            <p className="text-lg text-ink/75 leading-relaxed mb-8 max-w-md">{product.description}</p>

            <p className="font-mono text-3xl text-ink mb-8">{product.price}</p>

            <a
              href={product.sugargooLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackClick}
              className="btn-stamp w-full sm:w-auto !px-10 mb-8"
            >
              Buy on Sugargoo →
            </a>

            <div className="border-t border-line pt-6 space-y-3">
              <p className="text-sm text-ink/70 leading-relaxed">
                This listing ships from its seller to the Sugargoo warehouse for QC
                and consolidation, then on to your door.{' '}
                <a
                  href={product.sugargooLink}
                  target="_blank"
                  rel="noopener noreferrer"
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
          <Reveal as="section" className="mt-24 pt-14 border-t border-line">
            <h2 className="font-display font-black text-2xl md:text-3xl tracking-tightest mb-10">
              More in {product.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-10">
              {more.map((p) => (
                <Link key={p.id} href={`/product/${p.id}?category=${cat}`} className="flex flex-col group">
                  <div className="aspect-square bg-paper border border-line overflow-hidden mb-3">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-stamp transition-colors">
                    {p.name}
                  </h3>
                  <span className="font-mono text-sm">{p.price}</span>
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </>
  );
}
