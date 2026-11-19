import Link from 'next/link';
import Head from 'next/head';
import { CANONICAL_ORIGIN } from '@/lib/siteUrl';
import { useState, useEffect } from 'react';
import Stars from '@/components/Stars';
import { productMatchesBrand } from '@/lib/brandMatch';
import { useAuth } from '@/contexts/AuthContext';
import ProductImage from '@/components/ProductImage';
import ProductCard, { type ProductCardData } from '@/components/ProductCard';
import VerifiedSeal from '@/components/VerifiedSeal';
import VerifiedTick from '@/components/VerifiedTick';
import HowBuyingWorks from '@/components/HowBuyingWorks';
import { FASHION_CATEGORIES } from '@/lib/navCategories';

/** Featured brand: a brand card beside three of its pieces. */
function FeaturedBrand() {
  const [brand, setBrand] = useState<any>(null);
  const [items, setItems] = useState<ProductCardData[]>([]);

  useEffect(() => {
    fetch('/data/brands.json')
      .then((r) => r.json())
      .then((brands) => setBrand(brands.find((b: any) => b.brandName === 'Gray Dreams')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!brand) return;
    fetch('/api/products')
      .then((r) => r.json())
      .then((products: ProductCardData[]) => {
        setItems(products.filter((p) => p.image && productMatchesBrand(p.name, brand.brandName)).slice(0, 3));
      })
      .catch(() => {});
  }, [brand]);

  if (!brand) return null;

  return (
    <section className="container-edit pb-20 md:pb-28">
      <div className="bg-paper rounded-xl p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-4 min-w-0">
          <p className="text-sm text-muted mb-3">Featured brand</p>
          <h2 className="font-display text-ink text-4xl md:text-5xl leading-[0.95] mb-4">
            {brand.brandName}
            <VerifiedTick className="!w-5 !h-5 ml-2 align-middle" />
          </h2>
          <p className="text-ink/80 leading-relaxed mb-5 max-w-[42ch]">{brand.description}</p>
          <div className="flex flex-wrap gap-2 mb-7">
            {brand.aesthetic.map((tag: string) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <Link href={`/brands/${brand.slug}`} className="btn-secondary">
            View the brand
          </Link>
        </div>
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 min-w-0">
          {items.length > 0
            ? items.map((p, i) => (
                <div key={p.id} className={i === 2 ? 'hidden md:block' : ''}>
                  <ProductCard product={p} wishlistCategory="fashion" showGillyNote={false} />
                </div>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`aspect-[4/5] rounded-md bg-white/70 motion-safe:animate-pulse ${i === 2 ? 'hidden md:block' : ''}`} />
              ))}
        </div>
      </div>
    </section>
  );
}

/** Shop by category: photo tiles, each using a real product from that category. */
function CategoryTiles() {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()).catch(() => []),
      fetch('/api/products?category=tech').then((r) => r.json()).catch(() => []),
    ]).then(([fashion, tech]: [ProductCardData[], ProductCardData[]]) => {
      const pick: Record<string, string> = {};
      for (const c of FASHION_CATEGORIES) {
        const p = fashion.find((x) => x.category === c.match && x.image);
        if (p) pick[c.href] = p.image;
      }
      const t = tech.find((x) => x.image);
      if (t) pick['/tech-listings'] = t.image;
      setImages(pick);
    });
  }, []);

  const tiles = [
    ...FASHION_CATEGORIES,
    { label: 'All tech', href: '/tech-listings', match: '' },
  ];

  return (
    <section className="container-edit pb-24 md:pb-32">
      <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
        <h2 className="font-display text-ink text-2xl md:text-3xl">Shop by category</h2>
        <Link href="/brands" className="text-sm font-medium link-underline whitespace-nowrap">
          Or browse all 150+ brands →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {tiles.map((c) => (
          <Link key={c.href} href={c.href} className="group relative aspect-[4/5] md:aspect-square rounded-md overflow-hidden bg-paper">
            {images[c.href] && <ProductImage src={images[c.href]} alt="" />}
            <span className="absolute left-3 bottom-3 bg-white rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink group-hover:bg-ink group-hover:text-white transition-colors">
              {c.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A-style product grid under the intro: the most recently indexed fashion pieces. */
function LatestArrivals() {
  const [products, setProducts] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((all: ProductCardData[]) => {
        const latest = [...all]
          .filter((p) => p.image)
          .sort((a, b) => Number(b.id) - Number(a.id))
          .slice(0, 8);
        setProducts(latest);
      })
      .catch(() => setProducts([]));
  }, []);

  if (products && products.length === 0) return null;

  return (
    <section className="container-edit pb-20 md:pb-28">
      <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
        <h2 className="font-display text-ink text-2xl md:text-3xl">Latest additions</h2>
        <Link href="/fashion-listings" className="text-sm font-medium link-underline whitespace-nowrap">
          See all fashion →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
        {products
          ? products.map((p) => (
              <ProductCard key={p.id} product={p} wishlistCategory="fashion" showGillyNote={false} />
            ))
          : Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-md bg-paper motion-safe:animate-pulse" />
            ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>RAPID Marketplace — Your Gateway to Sugargoo</title>
        <meta
          name="description"
          content="RAPID indexes 150+ independent Chinese sellers, with new items indexed daily, routed through Sugargoo's consolidation warehouse into one simple checkout."
        />
        <link rel="canonical" href={`${CANONICAL_ORIGIN}/`} />
      </Head>

      {/* ---------- Intro (Direction A + B's intro block; no Gilly on the homepage) ---------- */}
      <section className="container-edit pt-8 md:pt-12 pb-14 md:pb-20">
        {user && (
          <Link
            href="/account"
            className="mb-8 flex items-center justify-between gap-3 bg-paper rounded-full px-5 py-3 hover:bg-line/60 transition-colors group"
          >
            <span className="text-sm font-medium text-ink">
              Welcome back{user.name ? `, ${user.name}` : ''}
            </span>
            <span className="text-sm text-muted group-hover:text-ink transition-colors">View your wishlist →</span>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
          <div className="md:col-span-6 lg:col-span-6">
            <h1 className="font-display text-ink text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] mb-6">
              Chinese labels,{' '}
              <span className="bg-hi px-[0.12em] box-decoration-clone">checked before</span>{' '}
              they ship.
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-[46ch] mb-8">
              150+ independent brands, with new pieces indexed daily. You buy through
              Sugargoo, and the warehouse photographs every order so you can check it
              before it ships to you.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/fashion-listings" className="btn-primary">Shop new arrivals</Link>
              <Link href="/tutorial" className="btn-secondary">How buying works</Link>
            </div>
          </div>
          <div className="md:col-span-6 lg:col-span-5 lg:col-start-8">
            <div className="relative aspect-[4/5] rounded-md overflow-hidden bg-paper max-w-[460px] mx-auto">
              {/* carousel-1.jpg is a three-photo strip; crop to its middle frame. */}
              <div
                role="img"
                aria-label="Washed nylon flight jacket from a brand indexed on RAPID"
                className="absolute inset-0 bg-no-repeat"
                style={{ backgroundImage: 'url(/carousel-1.jpg)', backgroundSize: '320% auto', backgroundPosition: '46.5% 35%' }}
              />
              <VerifiedSeal className="absolute left-3 top-3" />
            </div>
          </div>
        </div>
      </section>

      <LatestArrivals />

      {/* ---------- Trust strip ---------- */}
      <section className="container-edit pb-16 md:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
          <div className="bg-white p-5 md:p-6 flex flex-col gap-2">
            <Stars />
            <p className="text-sm text-ink"><b className="font-semibold">4.8 / 5</b> average seller rating</p>
          </div>
          <div className="bg-white p-5 md:p-6 flex flex-col gap-1">
            <p className="font-display text-2xl text-ink">47,000+</p>
            <p className="text-sm text-muted">hauls shipped through Sugargoo</p>
          </div>
          <div className="bg-white p-5 md:p-6 flex flex-col gap-1">
            <p className="font-display text-2xl text-ink">Every order</p>
            <p className="text-sm text-muted">photographed at the warehouse before it ships</p>
          </div>
        </div>
      </section>

      {/* ---------- How buying works (picture steps) ---------- */}
      <HowBuyingWorks className="pb-20 md:pb-28" />

      <FeaturedBrand />

      <CategoryTiles />
    </>
  );
}
