import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import Stamp from '@/components/Stamp';
import Stars from '@/components/Stars';
import Reveal from '@/components/Reveal';
import { productMatchesBrand } from '@/lib/brandMatch';

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
      .then((brands) => setBrand(brands.find((b: any) => b.brandName === 'Blankin')))
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
          <span className="eyebrow block mb-5">Featured Seller — 01 of 1,500</span>
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
          <div className="aspect-[4/5] bg-paper border border-line overflow-hidden">
            {productImage ? (
              <img src={productImage} alt={brand.brandName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full placeholder-media flex items-center justify-center font-mono text-xs uppercase tracking-wide text-muted text-center px-8">
                [ Product photograph — {brand.brandName} ]
              </div>
            )}
          </div>
          <div className="absolute -top-5 -left-5 hidden sm:block">
            <Stamp size={92} centerText="QC" sub="Passed" ringText="Quality Checked · Verified Seller ·" />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function Home() {
  return (
    <>
      <Head>
        <title>RAPID Marketplace — Your Gateway to Sugargoo</title>
        <meta
          name="description"
          content="RAPID indexes 1,500+ independent Chinese sellers and 3 million products, routed through Sugargoo's consolidation warehouse into one simple checkout."
        />
      </Head>

      {/* ---------- Hero ---------- */}
      <section className="pt-10 md:pt-14">
        <Reveal className="container-edit flex items-center justify-between mb-6 md:mb-10">
          <span className="eyebrow">N° 001 — Sourced Direct</span>
          <span className="eyebrow hidden sm:inline">Fashion / Tech / Accessories</span>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="font-display font-black text-ink leading-[0.88] tracking-tightest text-[clamp(2.75rem,11.5vw,9.5rem)] px-5 sm:px-8 lg:px-10 pb-1 select-none whitespace-nowrap">
            1,500 Sellers
          </h1>
        </Reveal>

        <Reveal delay={160} className="container-edit mt-10 md:mt-14 pb-6">
          <div className="relative pb-10 sm:pb-16 md:pb-20">
            <div className="aspect-[16/10] md:aspect-[21/9] overflow-hidden border border-line bg-paper">
              <img
                src="/assets/hero-main.png"
                alt="Streetwear sourced via RAPID sellers"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-2 sm:right-6 md:right-14 w-[46%] sm:w-[34%] md:w-[26%] aspect-[3/4] overflow-hidden border-4 border-stone shadow-stamp bg-paper">
              <img
                src="/assets/hero-detail.png"
                alt="Detail shot — RAPID seller network"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="hidden lg:block absolute top-4 right-0 font-mono text-[11px] tracking-widest text-muted"
              style={{ writingMode: 'vertical-rl' }}
            >
              RAPID · SHENZHEN → YOUR DOOR ·
            </div>
          </div>
          <div className="flex justify-between font-mono text-xs text-muted uppercase tracking-wide">
            <span>Field — streetwear sourced via RAPID sellers</span>
            <span className="hidden sm:inline">Photo — seller network</span>
          </div>
        </Reveal>

        <h1 className="font-display font-black text-ink leading-[0.88] tracking-tightest text-[clamp(2.75rem,11.5vw,9.5rem)] px-5 sm:px-8 lg:px-10 pb-1 select-none mt-4 md:mt-8">
          3M Products
        </h1>

        <Reveal className="container-edit mt-12 md:mt-16 pb-20 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <p className="lg:col-span-7 text-xl md:text-2xl leading-snug text-ink/90 max-w-2xl">
              RAPID indexes independent sellers across China and routes every order
              through Sugargoo&apos;s consolidation warehouse — so 1,500+ shops become
              one simple checkout.
            </p>
            <div className="lg:col-span-5 flex flex-wrap gap-3 lg:justify-end">
              <Link href="/signup" className="btn-stamp">Create Account</Link>
              <Link href="/fashion-listings" className="btn-secondary">Browse Fashion</Link>
              <Link href="/tutorial" className="btn-secondary">View Tutorial</Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- Consumer proof ---------- */}
      <Reveal as="section" className="container-edit pb-16 md:pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-10 py-7 border-y border-line">
          <div className="flex items-center gap-3 shrink-0">
            <Stars />
            <span className="font-mono text-sm text-ink">4.8 / 5 average seller rating</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-line shrink-0" />
          <p className="font-mono text-sm text-muted">
            47,000+ hauls shipped · 150+ verified sellers · buyer protection on every order
          </p>
        </div>
      </Reveal>

      <div className="perforated" />

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
              body: '1,500+ sellers and 3 million products, hand-organised by category so you can actually find something.',
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
              <span className="font-mono text-sm text-stamp">{step.n}</span>
              <h3 className="font-display font-black text-2xl mt-4 mb-4">{step.title}</h3>
              <p className="text-ink/75 leading-relaxed mb-7">{step.body}</p>
              <Link href={step.cta.href} className="link-underline font-mono text-xs uppercase tracking-wide">
                {step.cta.label} →
              </Link>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="perforated" />

      <FeaturedBrand />

      <div className="perforated" />

      {/* ---------- Category index ---------- */}
      <Reveal as="section" className="container-edit py-20 md:py-28">
        <div className="flex items-baseline justify-between mb-12">
          <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest">The index</h2>
          <Link href="/brands" className="link-underline font-mono text-xs uppercase tracking-wide hidden sm:inline">
            All 1,500 sellers →
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
                    <span className="font-display font-bold text-xl md:text-2xl group-hover:text-stamp transition-colors">
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
                    href={`/tech-listings?category=${slug}`}
                    className="flex items-center justify-between py-4 group"
                  >
                    <span className="font-display font-bold text-xl md:text-2xl group-hover:text-stamp transition-colors">
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
