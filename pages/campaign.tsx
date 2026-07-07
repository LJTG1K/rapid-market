import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Stars from '@/components/Stars';
import Stamp from '@/components/Stamp';
import Reveal from '@/components/Reveal';
import CascadeStack from '@/components/CascadeStack';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';

interface HighlightProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  sugargooLink: string;
}

const HIGHLIGHT_NAMES = [
  'YOKOSUKA HEAVY INDUSTRIES FOX SPRING & AUTUMN JACKET',
  'UUCSCC FUNCTIONAL WINTER ZIP UP JACKET',
  'DIAMOND SOLDIER BELT',
];

const CASCADE_IMAGES = [
  { src: '/assets/campaign/cascade-1.png', alt: 'Seller product photograph 1' },
  { src: '/assets/campaign/cascade-2.png', alt: 'Seller product photograph 2' },
  { src: '/assets/campaign/cascade-3.png', alt: 'Seller product photograph 3' },
  { src: '/assets/campaign/cascade-4.png', alt: 'Seller product photograph 4' },
];

const STATS = [
  { value: '150+', label: 'Verified sellers' },
  { value: '3M+', label: 'Products indexed' },
  { value: '4.8★', label: 'Average rating' },
];

const DIFFERENTIATORS = [
  {
    n: '01',
    title: 'One login',
    body: 'Sign up once and buy from any of 1,500+ Chinese sellers without juggling separate accounts, apps, or currencies.',
  },
  {
    n: '02',
    title: 'QC before it ships',
    body: 'Every haul is photographed at the Sugargoo warehouse before it leaves China, so you approve exactly what you’re getting.',
  },
  {
    n: '03',
    title: 'Buyer protection',
    body: 'Not happy with the QC photos? Request a replacement or a refund before international shipping even starts.',
  },
];

const STEPS = [
  { n: '01', title: 'Create your account', body: 'Free, instant Sugargoo account — no email verification.' },
  { n: '02', title: 'Find what you want', body: '1,500+ sellers, organised by category, searchable by brand.' },
  { n: '03', title: 'One box, one shipment', body: 'Everything consolidates at the warehouse and ships to you together.' },
];

const FAQS = [
  {
    q: 'How long does shipping take?',
    a: 'Sellers to the Sugargoo warehouse: 5–15 days. Warehouse to your door: a further 7–21 days depending on location.',
  },
  {
    q: 'What if I don’t like the QC photos?',
    a: 'Request a replacement or a refund directly through Sugargoo before your order ships internationally.',
  },
  {
    q: 'Is payment secure?',
    a: 'All payments run through Sugargoo’s secure gateway. RAPID never sees or handles your payment details.',
  },
  {
    q: 'Does it cost anything to join?',
    a: 'No. Creating a RAPID / Sugargoo account is free — you only ever pay the sellers and shipping, direct.',
  },
];

function ProductHighlights() {
  const [products, setProducts] = useState<HighlightProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((all: HighlightProduct[]) => {
        const matched = HIGHLIGHT_NAMES.map((name) =>
          all.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase())
        ).filter((p): p is HighlightProduct => Boolean(p));
        setProducts(matched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <Reveal as="section" className="container-edit py-12 md:py-16">
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest max-w-xl">
          Straight from the index
        </h2>
        <span className="eyebrow hidden sm:inline">Handpicked This Week</span>
      </div>

      {loading ? (
        <ProductGridSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-10">
          {products.map((p, i) => (
            <div key={p.id} className="flex flex-col">
              <Link href={`/product/${p.id}?category=fashion`} className="group">
                <div className="aspect-square bg-paper border border-line overflow-hidden mb-3">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <span className="font-mono text-[11px] text-stamp mb-1.5 block">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display font-black text-lg leading-snug mb-3 group-hover:text-stamp transition-colors">
                  {p.name}
                </h3>
              </Link>
              <div className="mt-auto flex items-center justify-between gap-3">
                <span className="font-mono text-sm">{p.price}</span>
                <a
                  href={p.sugargooLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary !px-4 !py-2 text-[11px]"
                >
                  Buy
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </Reveal>
  );
}

function StickyCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-stone/95 backdrop-blur-sm border-t border-line px-5 py-3 transition-transform duration-300 ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <Link href="/signup" className="btn-stamp w-full">
        Create Free Account
      </Link>
    </div>
  );
}

export default function Campaign() {
  return (
    <>
      <Head>
        <title>RAPID — Shop 1,500+ Chinese Sellers Through One Account</title>
        <meta
          name="description"
          content="Free Sugargoo account, instant approval. Browse 1,500+ verified sellers and 3M+ products, QC'd before they ship, consolidated into one box."
        />
        <meta name="robots" content="noindex, follow" />
      </Head>

      {/* ---------- Hero ---------- */}
      <section className="container-edit pt-14 md:pt-20 pb-16 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <Reveal className="lg:col-span-7">
            <span className="eyebrow block mb-5">No Membership Fee · Free To Join</span>
            <h1 className="font-display font-black text-ink text-5xl sm:text-6xl md:text-7xl tracking-tightest leading-[0.92] mb-7">
              One account. 1,500+ Chinese sellers. Zero markup.
            </h1>
            <p className="text-xl text-ink/80 leading-relaxed max-w-xl mb-8">
              RAPID plugs you into Sugargoo&apos;s warehouse network — every seller,
              every category, one checkout, one box home.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/signup" className="btn-stamp text-sm !px-8 !py-4">
                Create free account →
              </Link>
              <div className="flex items-center gap-2.5">
                <Stars />
                <span className="font-mono text-sm text-muted">4.8/5 · 47,000+ hauls shipped</span>
              </div>
            </div>
          </Reveal>

          <div className="hidden lg:block lg:col-span-5">
            <CascadeStack images={CASCADE_IMAGES} />
          </div>
        </div>
      </section>

      {/* ---------- Proof strip ---------- */}
      <Reveal as="section" className="bg-paper border-y border-line">
        <div className="container-edit grid grid-cols-3 divide-x divide-line">
          {STATS.map((s) => (
            <div key={s.label} className="py-8 sm:py-10 text-center">
              <p className="font-display font-black text-3xl sm:text-5xl tracking-tightest text-ink mb-1">
                {s.value}
              </p>
              <p className="font-mono text-[11px] sm:text-xs uppercase tracking-wide text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ---------- Product highlights ---------- */}
      <ProductHighlights />

      {/* ---------- Differentiators ---------- */}
      <Reveal as="section" className="container-edit py-20 md:py-28">
        <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest mb-4 max-w-xl">
          How this is different from ordering solo
        </h2>
        <p className="text-ink/70 max-w-xl mb-14">
          Buying direct from individual Chinese sellers means separate accounts,
          separate shipping, and no recourse if something goes wrong. RAPID removes
          all three.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8">
          {DIFFERENTIATORS.map((d) => (
            <div key={d.n} className="border-t border-line pt-6">
              <span className="font-mono text-sm text-stamp">{d.n}</span>
              <h3 className="font-display font-black text-2xl mt-3 mb-3">{d.title}</h3>
              <p className="text-ink/75 leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ---------- QC signature ---------- */}
      <Reveal as="section" className="bg-dusk text-stone">
        <div className="container-edit py-16 md:py-20 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <Stamp size={132} centerText="QC" sub="Passed" ringText="Quality Checked · Verified Seller ·" />
          <div className="text-center md:text-left">
            <h2 className="font-display font-black text-2xl md:text-3xl tracking-tightest mb-3">
              Every haul is inspected before it leaves China
            </h2>
            <p className="text-stone/70 max-w-lg leading-relaxed">
              Sugargoo photographs your order at the warehouse. You review it, approve
              it, and only then does it ship home — so you never pay international
              freight on something you wouldn&apos;t have bought.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ---------- How it works ---------- */}
      <Reveal as="section" className="container-edit py-20 md:py-28">
        <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest mb-14">
          Three steps, one checkout
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 mb-14">
          {STEPS.map((step) => (
            <div key={step.n}>
              <span className="font-mono text-sm text-stamp">{step.n}</span>
              <h3 className="font-display font-black text-xl mt-3 mb-2">{step.title}</h3>
              <p className="text-ink/70 leading-relaxed text-sm">{step.body}</p>
            </div>
          ))}
        </div>
        <Link href="/signup" className="btn-stamp">
          Create free account →
        </Link>
      </Reveal>

      {/* ---------- FAQ ---------- */}
      <Reveal as="section" className="container-edit pb-20 md:pb-28 max-w-2xl">
        <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest mb-10">
          Before you sign up
        </h2>
        <div className="border-t border-line">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group border-b border-line py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-semibold text-lg pr-6">{faq.q}</span>
                <span className="font-mono text-stamp shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-ink/70 leading-relaxed mt-4">{faq.a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      {/* ---------- Final CTA ---------- */}
      <Reveal as="section" className="bg-dusk text-stone">
        <div className="container-edit py-20 md:py-28 text-center">
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-tightest mb-6 max-w-3xl mx-auto">
            Your first haul is one signup away.
          </h2>
          <div className="flex flex-col items-center gap-5">
            <Link href="/signup" className="btn-stamp !px-10 !py-4 text-sm">
              Create free account →
            </Link>
            <div className="flex items-center gap-2.5">
              <Stars />
              <span className="font-mono text-sm text-stone/60">4.8/5 average seller rating · 47,000+ hauls shipped</span>
            </div>
          </div>
        </div>
      </Reveal>

      <StickyCTA />
      {/* Reserve space so the sticky bar never overlaps the final CTA on mobile */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
    </>
  );
}
