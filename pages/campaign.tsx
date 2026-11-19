import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import {
  CampaignTile,
  FaqList,
  SignupBand,
  StickySignup,
  TrustChips,
  pickVariedProducts,
  type CampaignProduct,
} from '@/components/CampaignParts';

/**
 * Meta-ads landing page (Direction A, "product wall"). Cold traffic sees real
 * products in the first second, beside one offer and one red signup button.
 * The header is stripped to the wordmark + signup (components/Header.tsx,
 * isCampaign). Every signup button goes to /signup, which owns the signup
 * tracking; product Buy buttons open the Sugargoo handoff, which offers
 * signup first to logged-out visitors.
 */

const HIGHLIGHT_NAMES = [
  'YOKOSUKA HEAVY INDUSTRIES FOX SPRING & AUTUMN JACKET',
  'UUCSCC FUNCTIONAL WINTER ZIP UP JACKET',
  'DIAMOND SOLDIER BELT',
];

const REASONS = [
  {
    title: 'One login for every seller',
    body: 'Sign up once and buy from 150+ Chinese labels without separate accounts, apps or currencies.',
  },
  {
    title: 'Photos before it ships',
    body: 'Sugargoo photographs every order at its warehouse. You approve exactly what you are getting.',
  },
  {
    title: 'Swap or refund if it is wrong',
    body: 'Not happy with the photos? Ask for a replacement or a refund before international shipping starts.',
  },
];

const STEPS = [
  { title: 'Create your free account', body: 'Instant Sugargoo account through RAPID. No email verification.' },
  { title: 'Pick what you like', body: '150+ brands, organised by category and searchable by name.' },
  { title: 'One box, one shipment', body: 'Everything consolidates at the warehouse and ships to you together.' },
];

const FAQS = [
  {
    q: 'How long does shipping take?',
    a: 'Sellers to the Sugargoo warehouse: 5–15 days. Warehouse to your door: a further 7–21 days depending on where you are.',
  },
  {
    q: 'What if I don’t like the photos?',
    a: 'Request a replacement or a refund directly through Sugargoo before your order ships internationally.',
  },
  {
    q: 'Is payment secure?',
    a: 'All payments run through Sugargoo’s secure checkout. RAPID never sees or handles your payment details.',
  },
  {
    q: 'Does it cost anything to join?',
    a: 'No. Your RAPID / Sugargoo account is free. You only pay for what you buy and its shipping.',
  },
];

function useFashionProducts() {
  const [products, setProducts] = useState<CampaignProduct[] | null>(null);
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((all: CampaignProduct[]) => setProducts(Array.isArray(all) ? all : []))
      .catch(() => setProducts([]));
  }, []);
  return products;
}

export default function Campaign() {
  const products = useFashionProducts();
  const wall = products ? pickVariedProducts(products, 6) : [];
  const highlights = products
    ? HIGHLIGHT_NAMES.map((n) => products.find((p) => p.name.trim().toLowerCase() === n.toLowerCase())).filter(
        (p): p is CampaignProduct => Boolean(p)
      )
    : [];

  return (
    <>
      <Head>
        <title>RAPID — Shop 150+ Chinese Labels Through One Free Account</title>
        <meta
          name="description"
          content="Free Sugargoo account, instant approval. Shop 150+ independent Chinese brands, see warehouse photos before anything ships, and get it all in one box."
        />
        <meta name="robots" content="noindex, follow" />
      </Head>

      {/* ---------- Hero + product wall ---------- */}
      <section className="container-edit pt-8 md:pt-14 pb-14 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <p className="text-sm text-muted mb-4">Free to join · no membership fee</p>
            <h1 className="font-display text-ink text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] mb-5">
              150+ Chinese labels. <span className="bg-hi px-[0.08em] box-decoration-clone">One free account.</span>
            </h1>
            <p className="hidden sm:block text-lg text-muted leading-relaxed max-w-[42ch] mb-7">
              Shop independent brands direct from China. Sugargoo photographs every order before it ships, and
              everything arrives in one box.
            </p>
            {/* Phones: shorter line, and the sticky bar carries the signup button,
                so the product wall shows on the first screen. */}
            <p className="sm:hidden text-muted leading-relaxed mb-4">Every order photographed before it ships. One box home.</p>
            <Link href="/signup" className="hidden sm:inline-flex btn-stamp !px-7 !py-3.5 text-[15px] mb-5">
              Create free account
            </Link>
            <TrustChips />
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {wall.length > 0
              ? wall.map((p, i) => (
                  <div key={p.id} className={i >= 4 ? 'hidden sm:block' : ''}>
                    <CampaignTile product={p} priority={i < 3} />
                  </div>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`aspect-[4/5] rounded-md bg-paper motion-safe:animate-pulse ${i >= 4 ? 'hidden sm:block' : ''}`} />
                ))}
          </div>
        </div>
      </section>

      {/* ---------- Three reasons ---------- */}
      <section className="container-edit pb-16 md:pb-24">
        <h2 className="font-display text-ink text-2xl md:text-3xl mb-3">Why buy through RAPID</h2>
        <p className="text-muted max-w-[56ch] mb-8">
          Ordering from individual Chinese sellers means separate accounts, separate shipping and no comeback if
          something is wrong. RAPID and Sugargoo remove all three.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REASONS.map((r) => (
            <div key={r.title} className="border border-line rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">{r.title}</h3>
              <p className="text-muted leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- The photo check ---------- */}
      <section className="container-edit pb-16 md:pb-24">
        <div className="bg-paper rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 items-center">
          <div
            className="aspect-[4/3] md:aspect-auto md:h-full min-h-[240px] bg-cover bg-center"
            style={{ backgroundImage: 'url(/assets/campaign/cascade-2.webp)' }}
            role="img"
            aria-label="Warehouse-style product photo of wide leg jeans"
          />
          <div className="p-7 md:p-12">
            <h2 className="font-display text-ink text-2xl md:text-3xl mb-4">Every order is photographed before it leaves China</h2>
            <p className="text-muted leading-relaxed mb-6 max-w-[46ch]">
              Sugargoo photographs your order at its warehouse. You check it, approve it, and only then does it ship
              home, so you never pay international shipping on something you wouldn&apos;t have bought.
            </p>
            <Link href="/signup" className="btn-stamp">
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- How buying works ---------- */}
      <section className="container-edit pb-16 md:pb-24">
        <h2 className="font-display text-ink text-2xl md:text-3xl mb-8">How buying works</h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border border-line rounded-xl p-6">
              <span className="w-8 h-8 rounded-full bg-ink text-white grid place-items-center text-sm font-semibold mb-5">{i + 1}</span>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-muted leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- More products ---------- */}
      {highlights.length > 0 && (
        <section className="container-edit pb-16 md:pb-24">
          <h2 className="font-display text-ink text-2xl md:text-3xl mb-8">Straight from the index</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-10">
            {highlights.map((p, i) => (
              <div key={p.id} className={i === 2 ? 'hidden md:block' : ''}>
                <ProductCard product={p} wishlistCategory="fashion" showGillyNote={false} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- FAQ ---------- */}
      <section className="container-edit pb-16 md:pb-24">
        <div className="max-w-3xl">
          <h2 className="font-display text-ink text-2xl md:text-3xl mb-6">Before you sign up</h2>
          <FaqList items={FAQS} />
        </div>
      </section>

      <SignupBand title="Your first haul is one signup away." />
      <StickySignup />
    </>
  );
}
