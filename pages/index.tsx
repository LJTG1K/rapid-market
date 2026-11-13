import Link from 'next/link';
import Head from 'next/head';
import { CANONICAL_ORIGIN } from '@/lib/siteUrl';
import { useState, useEffect } from 'react';
import Stars from '@/components/Stars';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import PerforatedDivider from '@/components/PerforatedDivider';
import { productMatchesBrand } from '@/lib/brandMatch';
import { useAuth } from '@/contexts/AuthContext';
import ProductImage from '@/components/ProductImage';
import ProductCard, { type ProductCardData } from '@/components/ProductCard';
import VerifiedSeal from '@/components/VerifiedSeal';

interface BrandProduct {
  id: string;
  name: string;
  image: string;
  brand: string;
}

const FASHION_INDEX = [
  ['T-Shirts', 't-shirts'],
  ['Hoodies', 'hoodies'],
  ['Jackets', 'jackets'],
  ['Pants', 'pants'],
  ['Outerwear', 'outerwear'],
  ['Bags', 'bags'],
  ['Accessories', 'accessories'],
];

const TECH_INDEX = [
  ['Gaming', 'gaming'],
  ['Audio', 'audio'],
  ['Lighting', 'lighting'],
  ['Phone Cases', 'phone-cases'],
  ['Phone Accessories', 'phone-accessories'],
  ['Desk Setup', 'desk-setup'],
  ['Skins & Wraps', 'skins-wraps'],
];

function FeaturedBrand() {
  const [brand, setBrand] = useState<any>(null);
  const [productImage, setProductImage] = useState<string>('');

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
      .then((products: BrandProduct[]) => {
        const match = products.find((p) => productMatchesBrand(p.name, brand.brandName));
        if (match) setProductImage(match.image);
      })
      .catch(() => {});
  }, [brand]);

  if (!brand) return null;

  return (
    <Reveal as="section" className="container-edit py-20 md:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-6 order-2 lg:order-1">
          <span className="eyebrow block mb-5">Featured Seller — 01 of 150+</span>
          <h2 className="font-display font-black text-ink text-5xl md:text-6xl tracking-tightest leading-[0.92] mb-6">
            {brand.brandName}
          </h2>
          <p className="text-lg text-ink/80 leading-relaxed max-w-md mb-6">
            {brand.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {brand.aesthetic.map((tag: string) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <Link href={`/brands/${brand.slug}`} className="btn-secondary">
            View Seller Index →
          </Link>
        </div>

        <div className="lg:col-span-6 order-1 lg:order-2 relative">
          <div className="aspect-[4/5] bg-paper rounded-md overflow-hidden">
            {productImage ? (
              <ProductImage src={productImage} alt={brand.brandName} variant="detail" />
            ) : (
              <div className="w-full h-full placeholder-media flex items-center justify-center font-mono text-xs uppercase tracking-wide text-muted text-center px-8">
                [ Product photograph — {brand.brandName} ]
              </div>
            )}
          </div>
          <VerifiedSeal className="absolute left-3 top-3" />
        </div>
      </div>
    </Reveal>
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
        <h2 className="font-body font-semibold text-2xl md:text-3xl tracking-tight">Latest additions</h2>
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
            <h1 className="font-display text-ink text-[clamp(2.5rem,5.6vw,4.75rem)] leading-[1.02] mb-6">
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

      {/* ---------- Consumer proof ---------- */}
      <Reveal as="section" className="container-edit pb-16 md:pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-10 py-7 border-y border-line">
          <div className="flex items-center gap-3 shrink-0">
            <Stars />
            <span className="font-mono text-sm text-ink">
              <CountUp value="4.8" /> / 5 average seller rating
            </span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-line shrink-0" />
          <p className="font-mono text-sm text-muted">
            <CountUp value="47,000+" /> hauls shipped · <CountUp value="150+" /> verified sellers · buyer protection on every order
          </p>
        </div>
      </Reveal>

      <PerforatedDivider />

      {/* ---------- Process ---------- */}
      <Reveal as="section" className="container-edit py-20 md:py-28">
        <div className="flex items-baseline justify-between mb-12 md:mb-16">
          <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest">How it works</h2>
          <span className="eyebrow hidden sm:inline">Three steps, one checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-t border-line">
          {[
            {
              n: '01',
              title: 'Create your account',
              body: 'Join Sugargoo through our invitation link to unlock verified-warehouse features and batch shopping.',
              cta: { href: '/signup', label: 'Create account' },
            },
            {
              n: '02',
              title: 'Browse our index',
              body: '150+ sellers, hand-organised by category, with new items indexed daily so you can actually find something.',
              cta: { href: '/fashion-listings', label: 'View listings' },
            },
            {
              n: '03',
              title: 'Order through Sugargoo',
              body: 'Add items to cart, they ship to the Sugargoo warehouse for consolidation, then on to your door after QC.',
              cta: { href: '/tutorial', label: 'Read the full guide' },
            },
          ].map((step, i) => (
            <div
              key={step.n}
              className={`border-b lg:border-b-0 lg:border-r border-line last:border-r-0 py-10 ${
                i === 0 ? 'lg:pr-10' : i === 2 ? 'lg:pl-10' : 'lg:px-10'
              }`}
            >
              <span className="font-mono text-sm text-muted">{step.n}</span>
              <h3 className="font-display font-black text-2xl mt-4 mb-4">{step.title}</h3>
              <p className="text-ink/75 leading-relaxed mb-7">{step.body}</p>
              <Link href={step.cta.href} className="link-underline font-mono text-xs uppercase tracking-wide">
                {step.cta.label} →
              </Link>
            </div>
          ))}
        </div>
      </Reveal>

      <PerforatedDivider />

      <FeaturedBrand />

      <PerforatedDivider />

      {/* ---------- Category index ---------- */}
      <Reveal as="section" className="container-edit py-20 md:py-28">
        <div className="flex items-baseline justify-between mb-12">
          <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest">The index</h2>
          <Link href="/brands" className="link-underline font-mono text-xs uppercase tracking-wide hidden sm:inline">
            All 150+ sellers →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
          <div>
            <p className="eyebrow mb-4">Fashion</p>
            <ul>
              {FASHION_INDEX.map(([label, slug], i) => (
                <li key={slug} className="border-t border-line last:border-b">
                  <Link
                    href={`/fashion-listings?category=${slug}`}
                    className="flex items-center justify-between py-4 group"
                  >
                    <span className="font-display font-bold text-xl md:text-2xl group-hover:underline">
                      {label}
                    </span>
                    <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-12 md:mt-0">
            <p className="eyebrow mb-4">Tech</p>
            <ul>
              {TECH_INDEX.map(([label, slug], i) => (
                <li key={slug} className="border-t border-line last:border-b">
                  <Link
                    href={slug === 'phone-cases' ? '/phone-cases' : `/tech-listings?category=${slug}`}
                    className="flex items-center justify-between py-4 group"
                  >
                    <span className="font-display font-bold text-xl md:text-2xl group-hover:underline">
                      {label}
                    </span>
                    <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </>
  );
}
