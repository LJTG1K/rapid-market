import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import StyleQuizSection from '@/components/StyleQuizSection';
import ProductCard from '@/components/ProductCard';
import { SignupBand, StickySignup, TrustChips, type CampaignProduct } from '@/components/CampaignParts';
import { matchProducts, STYLE_OPTIONS, type Brand, type StyleKey, type Product as MatchableProduct } from '@/lib/styleMatch';

/**
 * Reddit-ads landing page (Direction C, "quiz first"). The first quiz question
 * is the hero, with a photo tile per style, so the first tap happens before
 * any reading. Quiz completion is tracked inside StyleQuizSection
 * (trackQuizComplete); signup buttons go to /signup, which owns signup
 * tracking. The header is the stripped campaign header (Header.tsx).
 */

const WHY = [
  {
    title: 'Brands you won’t find elsewhere',
    body: 'Small independent labels and factories direct from China. Not Shein, not Amazon, not the same twelve dropshippers.',
  },
  {
    title: 'The quiz isn’t decoration',
    body: 'Three questions return real listings from the actual catalogue, not a generic "trending now" shelf.',
  },
  {
    title: 'Still runs through Sugargoo',
    body: 'Same warehouse photos before it ships, same one-box consolidation you already trust.',
  },
];

/** One real product photo per quiz style, picked by the same matcher the quiz uses. */
function useStyleImages(products: MatchableProduct[] | null, brands: Brand[] | null) {
  // Starts as {} (not undefined) so the quiz renders photo tiles from the first paint.
  const [images, setImages] = useState<Partial<Record<StyleKey, string>>>({});
  useEffect(() => {
    if (!products || !brands) return;
    let cancelled = false;
    const used = new Set<string>();
    const shuffled = [...products].sort(() => Math.random() - 0.5);

    // Seller CDN links sometimes die, so each candidate photo is test-loaded
    // and the first one that actually loads wins. Tiles fill in one by one.
    const loads = (src: string) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        const t = setTimeout(() => resolve(false), 6000);
        img.onload = () => { clearTimeout(t); resolve(img.naturalWidth > 0); };
        img.onerror = () => { clearTimeout(t); resolve(false); };
        img.src = src;
      });

    // All four styles load in parallel.
    STYLE_OPTIONS.forEach(async (opt) => {
      {
        // Prefer products hand-tagged with this style in the Sheet; then the
        // quiz matcher (brand aesthetics).
        const candidates = [
          ...shuffled.filter((p) => p.image && p.manualStyleTags?.includes(opt.key)),
          ...matchProducts(products, brands, { styles: [opt.key], budget: 'blowMeAway', fit: 'regular' }, 20),
        ]
          .map((p) => p.image)
          .filter((src, i, arr) => src && !used.has(src) && arr.indexOf(src) === i)
          .slice(0, 6);
        for (const src of candidates) {
          if (cancelled) return;
          if (await loads(src)) {
            used.add(src);
            setImages((prev) => ({ ...prev, [opt.key]: src }));
            break;
          }
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [products, brands]);
  return images;
}

export default function Reddit() {
  const [products, setProducts] = useState<(MatchableProduct & CampaignProduct)[] | null>(null);
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [hasAnswers, setHasAnswers] = useState(false);

  useEffect(() => {
    fetch('/api/products?category=fashion')
      .then((r) => r.json())
      .then((all) => setProducts(Array.isArray(all) ? all : []))
      .catch(() => setProducts([]));
    fetch('/data/brands.json')
      .then((r) => r.json())
      .then(setBrands)
      .catch(() => setBrands([]));
  }, []);

  const styleImages = useStyleImages(products, brands);
  // Shuffled once per page load, not on every re-render.
  const showcase = useMemo(
    () => (products ? [...products].filter((p) => p.image && p.brand).sort(() => Math.random() - 0.5).slice(0, 3) : []),
    [products]
  );

  return (
    <>
      <Head>
        <title>RAPID: Find Chinese Labels That Fit Your Style</title>
        <meta
          name="description"
          content="Answer three questions and get matched to real listings from 150+ independent Chinese brands, bought through Sugargoo."
        />
        <meta name="robots" content="noindex, follow" />
      </Head>

      {/* ---------- Hero = the quiz ---------- */}
      <section className="container-edit pt-8 md:pt-12 pb-14 md:pb-20">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <p className="text-sm text-muted mb-3">Struggling with agent restrictions? Try something different for your next haul.</p>
          <h1 className="font-display text-ink text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.04]">
            Find Chinese labels that <span className="bg-hi px-[0.08em] box-decoration-clone">fit your style.</span>
          </h1>
        </div>

        {hasAnswers && (
          <div className="mb-10 bg-paper rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <h2 className="font-display text-ink text-2xl md:text-3xl mb-1">Your matches are below. Want them?</h2>
              <p className="text-muted">Create a free account to buy them. It works on Sugargoo straight away, no email verification.</p>
            </div>
            <Link href="/signup" className="btn-stamp !px-7 !py-3.5 text-[15px] self-start md:self-auto">
              Create free account
            </Link>
          </div>
        )}

        <StyleQuizSection hideHeading styleImages={styleImages} onAnswersChange={setHasAnswers} />



        {!hasAnswers && <p className="text-center text-sm text-muted mt-6">3 questions · 30 seconds · then your matches</p>}
      </section>

      {/* ---------- Trust ---------- */}
      <section className="container-edit pb-12 md:pb-16">
        <div className="grid grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line text-center">
          {[
            ['150+', 'brands indexed'],
            ['1,500+', 'products listed'],
            ['4.8', 'seller rating'],
          ].map(([v, l]) => (
            <div key={l} className="bg-white py-6 px-2">
              <p className="font-display text-ink text-2xl md:text-3xl">{v}</p>
              <p className="text-[13px] text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Why an index ---------- */}
      <section className="container-edit pb-16 md:pb-24">
        <h2 className="font-display text-ink text-2xl md:text-3xl mb-3">Why bother with an index</h2>
        <p className="text-muted max-w-[56ch] mb-8">
          You already know what an agent does. This just stops you having fifty Taobao tabs open at once.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WHY.map((w) => (
            <div key={w.title} className="border border-line rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">{w.title}</h3>
              <p className="text-muted leading-relaxed">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Random pull ---------- */}
      {showcase.length > 0 && (
        <section className="container-edit pb-16 md:pb-24">
          <h2 className="font-display text-ink text-2xl md:text-3xl mb-2">A random pull from the index</h2>
          <p className="text-muted mb-8">Real sellers, real listings, picked at random just now.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-10">
            {showcase.map((p, i) => (
              <div key={p.id} className={i === 2 ? 'hidden md:block' : ''}>
                <ProductCard product={p} wishlistCategory="fashion" showGillyNote={false} />
              </div>
            ))}
          </div>
          <TrustChips className="mt-10" />
        </section>
      )}

      <SignupBand title="Your next haul starts with a free account." />
      {/* Only after the quiz: before that, the quiz is the thing to tap. */}
      {hasAnswers && <StickySignup />}
    </>
  );
}
