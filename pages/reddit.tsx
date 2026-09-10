import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Stars from '@/components/Stars';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import PerforatedDivider from '@/components/PerforatedDivider';
import ProductImage from '@/components/ProductImage';
import StyleQuizSection from '@/components/StyleQuizSection';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import LoadingMessage, { MANIFEST_MESSAGES } from '@/components/LoadingMessage';

interface ShowcaseProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  sugargooLink: string;
}

const STATS = [
  { value: '150+', label: 'Sellers indexed' },
  { value: '2,000+', label: 'Products listed' },
  { value: '4.8★', label: 'Average rating' },
];

const WHY = [
  {
    n: '01',
    title: 'Brands you won’t find elsewhere',
    body: 'Small independent labels and factories direct from China. Not Shein, not Amazon, not the same twelve dropshippers everyone else is reselling.',
  },
  {
    n: '02',
    title: 'The quiz isn’t decoration',
    body: 'Three questions feed real listings back from the actual catalog, not a generic "trending now" shelf with your name pasted on it.',
  },
  {
    n: '03',
    title: 'Still runs through Sugargoo',
    body: 'Same QC-before-it-ships, same one-box consolidation you already trust. RAPID just handles the part where you find something worth ordering.',
  },
];

function RandomShowcase() {
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?category=fashion')
      .then((r) => r.json())
      .then((all: ShowcaseProduct[]) => {
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        setProducts(shuffled.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <LoadingMessage messages={MANIFEST_MESSAGES} className="mb-6 justify-center" />
        <ProductGridSkeleton count={3} aspect="4:5" />
      </>
    );
  }

  if (products.length === 0) return null;

  return (
    <Reveal stagger={60} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-10">
      {products.map((p, i) => (
        <div key={p.id} className="flex flex-col">
          <Link href={`/product/${p.id}?category=fashion`} className="group">
            <div className="aspect-[4/5] bg-paper border border-line overflow-hidden mb-3">
              <ProductImage src={p.image} alt={p.name} />
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

export default function Reddit() {
  return (
    <>
      <Head>
        <title>RAPID: Indexing Authentic Chinese Brands</title>
        <meta
          name="description"
          content="150+ sellers, 2,000+ products, one index of authentic Chinese fashion. Answer three questions and get matched to real listings, routed through Sugargoo."
        />
        <meta name="robots" content="noindex, follow" />
      </Head>

      {/* ---------- Hero + quiz ---------- */}
      <section className="container-edit pt-12 md:pt-16 pb-16 md:pb-20">
        <div className="max-w-lg mx-auto text-center mb-12">
          <Reveal>
            <span className="eyebrow block mb-5">Indexing Authentic Chinese Brands</span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display font-black text-ink text-4xl sm:text-5xl tracking-tightest leading-[0.95] mb-4">
              150+ sellers. Tell us what you&apos;re actually after.
            </h1>
            <p className="text-ink/70 leading-relaxed">
              RAPID indexes real Chinese fashion brands, the small labels and factories
              you won&apos;t find on Shein or Amazon, so your next haul actually goes
              somewhere. Answer three questions, get real listings back.
            </p>
          </Reveal>
        </div>

        <Reveal delay={140}>
          <StyleQuizSection />
        </Reveal>
      </section>

      <div className="container-edit">
        <PerforatedDivider />
      </div>

      {/* ---------- Proof strip ---------- */}
      <Reveal as="section" className="bg-paper border-y border-line">
        <div className="container-edit grid grid-cols-3 divide-x divide-line">
          {STATS.map((s) => (
            <div key={s.label} className="py-8 sm:py-10 text-center">
              <p className="font-display font-black text-3xl sm:text-5xl tracking-tightest text-ink mb-1">
                <CountUp value={s.value} />
              </p>
              <p className="font-mono text-[11px] sm:text-xs uppercase tracking-wide text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ---------- Why an index ---------- */}
      <Reveal as="section" className="container-edit py-16 md:py-24">
        <h2 className="font-display font-black text-2xl md:text-3xl tracking-tightest mb-4 max-w-xl">
          Why bother with an index
        </h2>
        <p className="text-ink/70 max-w-xl mb-12">
          You already know what an agent does. This just stops you from having fifty
          Taobao tabs open at the same time.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8">
          {WHY.map((w) => (
            <div key={w.n} className="border-t border-line pt-6">
              <span className="font-mono text-sm text-stamp">{w.n}</span>
              <h3 className="font-display font-black text-xl mt-3 mb-3">{w.title}</h3>
              <p className="text-ink/75 leading-relaxed text-sm">{w.body}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ---------- Random pull from the index ---------- */}
      <Reveal as="section" className="bg-dusk text-stone">
        <div className="container-edit py-20 md:py-28">
          <div className="text-center mb-14">
            <h2 className="font-display font-black text-3xl md:text-5xl tracking-tightest mb-4 max-w-2xl mx-auto">
              A random pull from the index.
            </h2>
            <p className="text-stone/70 max-w-lg mx-auto leading-relaxed">
              Real sellers, real listings, nothing staged for the ad. Three items out of
              2,000+, grabbed at random just now.
            </p>
          </div>

          <RandomShowcase />

          <div className="flex flex-col items-center gap-5 mt-16">
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
