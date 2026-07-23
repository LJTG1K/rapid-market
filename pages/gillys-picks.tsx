import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Stamp from '@/components/Stamp';
import Reveal from '@/components/Reveal';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import LoadingMessage, { CATEGORY_MESSAGES } from '@/components/LoadingMessage';
import WishlistButton from '@/components/WishlistButton';
import PerforatedDivider from '@/components/PerforatedDivider';

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
}

const GILLYS_PICKS = [
  'BEVAN UP CURVED ZIPPER JACKET',
  'BEVAN UP NYLON LIGHTWEIGHT ZIP UP',
  'BEVAN UP SEE THROUGH SUN PROTECTION JACKET',
  'FOURTH3EX MUSIC NOTE BUCKLE PIANO BELT',
  'FOURTH3EX DESTROYED DOUBLE WAIST MUSIC NOTE WIDE LEG PANTS',
  'FOURTH3EX MUSIC NOTE SWEATPANTS',
  'ROLLINGMONEY DIAMOND 10 BAGGY DENIM JEANS',
  'ROLLINGMONEY FUR LEATHER BAG',
  'ROLLINGMONEY SNAKE DENIM JEANS',
];

export default function GillysPicks() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((allProducts) => {
        setFilteredProducts(
          allProducts.filter((p: Product) => GILLYS_PICKS.some((name) => p.name.toLowerCase() === name.toLowerCase()))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
    url: 'https://rapid.market/gillys-picks',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: filteredProducts.length,
      itemListElement: filteredProducts.slice(0, 50).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://rapid.market/fashion-listings/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
        name: product.name,
        image: product.image,
      })),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rapid.market' },
      { '@type': 'ListItem', position: 2, name: "Gilly's Picks", item: 'https://rapid.market/gillys-picks' },
    ],
  };

  return (
    <>
      <Head>
        <title>Gilly&apos;s Picks — RAPID Marketplace</title>
        <meta name="description" content="Curated selection of best-performing products from Gilly video reviews." />
        <link rel="canonical" href="https://rapid.market/gillys-picks" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          <div className="lg:col-span-8">
            <span className="eyebrow block mb-3">Curated Edition</span>
            <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-6">
              Gilly&apos;s Picks
            </h1>
            <p className="text-xl text-ink/80 leading-relaxed max-w-xl mb-3">
              The products that made the cut. Gilly saw them, wore them, and now
              they&apos;re indexed on RAPID.
            </p>
            <p className="eyebrow">
              {loading ? 'Loading…' : `${filteredProducts.length} items hand-picked`}
            </p>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <Stamp size={104} centerText="G" sub="Curator Pick" ringText="Selected By Gilly · Reviewed On Video ·" />
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
            <Reveal stagger={60} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
              {filteredProducts.map((product) => (
                <div key={product.id} className="flex flex-col relative">
                  <WishlistButton productId={product.id} category="fashion" className="absolute top-2 right-2 z-10" />
                  <Link href={`/product/${product.id}`} className="group">
                    <div className="aspect-[4/5] bg-paper border border-line overflow-hidden mb-3">
                      <img
                        src={product.image}
                        alt={`${product.name} — picked by Gilly`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-stamp transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted mb-3 line-clamp-2">{product.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <span className="font-mono text-sm">{product.price}</span>
                    <a
                      href={product.sugargooLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick(product.id, product.name, product)}
                      className="btn-primary !px-4 !py-2 text-[11px]"
                    >
                      Buy
                    </a>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        )}

        <PerforatedDivider className="mt-20" />
        <div className="pt-10 text-center">
          <h3 className="font-display font-black text-2xl md:text-3xl tracking-tightest mb-3">Want more?</h3>
          <p className="text-ink/70 max-w-xl mx-auto mb-6">
            Browse the full fashion index — thousands of pieces from 100+ sellers.
          </p>
          <Link href="/fashion-listings" className="btn-primary">
            Browse all listings
          </Link>
        </div>
      </div>
    </>
  );
}
