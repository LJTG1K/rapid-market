import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import LoadingMessage, { CATEGORY_MESSAGES } from '@/components/LoadingMessage';
import PerforatedDivider from '@/components/PerforatedDivider';
import ProductCard from '@/components/ProductCard';
import { isGillyPick, PICKS_PER_VISIT } from '@/lib/gillyPicks';

declare global {
  interface Window {
    gtag?: Function;
  }
}

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
  gillyNote?: string;
}


function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isPick(p: Product) {
  return isGillyPick(p.id);
}

/** Gilly's own ink stamp. Only used on Gilly's Picks, never the homepage. */
function GillyStamp({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id="gilly-ring" d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" className="stroke-pen" strokeWidth="3" />
      <circle cx="50" cy="50" r="27" fill="none" className="stroke-pen" strokeWidth="1.5" />
      <text fontFamily="Instrument Sans, Arial, sans-serif" fontSize="9.5" fontWeight="700" letterSpacing="2" className="fill-pen">
        <textPath href="#gilly-ring">WORN BY GILLY · CHECKED · </textPath>
      </text>
      <text x="50" y="59" textAnchor="middle" fontFamily="Nanum Pen Script, cursive" fontSize="28" className="fill-pen">G.</text>
    </svg>
  );
}

export default function GillysPicks() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((allProducts) => {
        setFilteredProducts(shuffle((allProducts as Product[]).filter(isPick)).slice(0, PICKS_PER_VISIT));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Runs on the actual exit to Sugargoo (after the handoff sheet). The shared
  // ad-platform buy_click already fired there; this adds the GA view_item and
  // the gilly-pick-click log.
  const trackClick = async (productId: string, productName: string, product?: Product) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        items: [{
          item_id: productId,
          item_name: productName,
          item_category: product?.category,
          item_brand: product?.brand,
          price: product?.price.replace('$', ''),
          source: 'gilly-picks',
        }],
      });
    }
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName, type: 'gilly-pick-click' }),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const collectionSchema = {
    '@context': 'https://schema.org/',
    '@type': 'CollectionPage',
    name: "Gilly's Picks",
    description: 'Curated selection of best-performing products from Gilly video reviews',
    url: 'https://www.rapid.market/gillys-picks',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: filteredProducts.length,
      itemListElement: filteredProducts.slice(0, 50).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://www.rapid.market/product/${encodeURIComponent(product.id)}`,
        name: product.name,
        image: product.image,
      })),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.rapid.market' },
      { '@type': 'ListItem', position: 2, name: "Gilly's Picks", item: 'https://www.rapid.market/gillys-picks' },
    ],
  };

  return (
    <>
      <Head>
        <title>Gilly&apos;s Picks — RAPID Marketplace</title>
        <meta name="description" content="Curated selection of best-performing products from Gilly video reviews." />
        <link rel="canonical" href="https://www.rapid.market/gillys-picks" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 items-center mb-16">
          <div className="md:col-span-6">
            <span className="eyebrow block mb-4">Gilly&apos;s Picks</span>
            <h1 className="font-display text-ink text-[clamp(2.5rem,5.6vw,4.5rem)] leading-[1.02] mb-6">
              Chinese labels, <span className="bg-hi px-[0.12em] box-decoration-clone">worn first</span> by Gilly.
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-[46ch] mb-3">
              The pieces that made the cut. Gilly saw them, wore them, and left a note on
              fit and fabric so you know what to expect when the warehouse photos come in.
            </p>
            <p className="text-sm text-muted">
              {loading ? 'Loading…' : `${filteredProducts.length} picks this visit`}
            </p>
          </div>
          <div className="md:col-span-5 md:col-start-8 relative justify-self-center w-full max-w-[340px]">
            <GillyStamp className="absolute -left-5 -top-6 z-10 w-[92px] h-[92px] -rotate-12" />
            <div className="relative aspect-[4/5] rounded-md overflow-hidden bg-paper">
              {/* carousel-3.jpg is a three-photo strip; crop to its middle frame. */}
              <div
                role="img"
                aria-label="Varsity jacket and washed denim, picked by Gilly"
                className="absolute inset-0 bg-no-repeat"
                style={{ backgroundImage: 'url(/carousel-3.jpg)', backgroundSize: '345% auto', backgroundPosition: '47.5% 40%' }}
              />
            </div>
            <p className="gilly-note !text-[30px] absolute -right-2 -bottom-7 -rotate-3 bg-white border border-line px-3 py-1.5">
              the varsity one.<br />trust me.
            </p>
          </div>
        </div>

        <PerforatedDivider />

        {loading ? (
          <div className="pt-12">
            <LoadingMessage messages={CATEGORY_MESSAGES.gillys} className="mb-6" />
            <ProductGridSkeleton aspect="4:5" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="font-mono text-sm text-muted py-12">No picked items found yet. Check back soon!</p>
        ) : (
          <div className="pt-12">
            <Reveal stagger={60} className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-12">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wishlistCategory="fashion"
                  onBuyClick={() => trackClick(product.id, product.name, product)}
                />
              ))}
            </Reveal>
          </div>
        )}

        <PerforatedDivider className="mt-20" />
        <div className="pt-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-3">Want more?</h2>
          <p className="text-ink/70 max-w-xl mx-auto mb-6">
            Browse the full fashion index — 1,500+ pieces from 150+ sellers.
          </p>
          <Link href="/fashion-listings" className="btn-primary">
            Browse all listings
          </Link>
        </div>
      </div>
    </>
  );
}
