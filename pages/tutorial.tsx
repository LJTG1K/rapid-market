import Head from 'next/head';
import Link from 'next/link';
import Reveal from '@/components/Reveal';

const ICONS: Record<string, JSX.Element> = {
  cart: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-7 h-7">
      <path d="M3 4h3l3 16h15l3-11H8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="26" r="1.6" />
      <circle cx="22" cy="26" r="1.6" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-7 h-7">
      <path d="M4 10l12-6 12 6-12 6-12-6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10v12l12 6 12-6V10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 16v12" strokeLinecap="round" />
    </svg>
  ),
  ship: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-7 h-7">
      <path d="M5 15h22l-3 10H8L5 15z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 15V7h10v8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3v4" strokeLinecap="round" />
    </svg>
  ),
};

const ORDER_STEPS = [
  { n: '3A', title: 'Add items to cart', icon: 'cart', body: 'Click the "Buy on Sugargoo" link on any product. It opens directly on Sugargoo — add it to your cart and check out.' },
  { n: '3B', title: 'Items ship to Sugargoo', icon: 'box', body: 'Your items ship from their individual sellers to the Sugargoo warehouse, where they’re consolidated into a single parcel.' },
  { n: '3C', title: 'QC & ship home', icon: 'ship', body: 'Sugargoo photographs everything for quality control. Approve the photos and request international shipping to your door.' },
];

const FAQS = [
  {
    q: 'How long does shipping take?',
    a: 'Shipping from individual sellers to Sugargoo typically takes 5–15 days. International shipping from the warehouse then takes a further 7–21 days depending on your location.',
  },
  {
    q: "What if I'm not happy with the QC photos?",
    a: 'You can request a replacement or a refund directly through Sugargoo — they run a full dispute resolution process on every consolidated order.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Yes. All payments are processed through Sugargoo’s secure payment gateway — RAPID never handles your payment details directly.',
  },
  {
    q: 'Can I get support?',
    a: 'Join our Discord community for support from other members, or reach out by email — details are on the sign-up page.',
  },
];

export default function Tutorial() {
  return (
    <>
      <Head>
        <title>Ordering Guide — RAPID Marketplace</title>
        <meta name="description" content="The full guide to ordering through RAPID and Sugargoo" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <span className="eyebrow block mb-3">Guide</span>
        <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-14 max-w-3xl">
          The ordering guide
        </h1>

        {/* Video */}
        <Reveal className="aspect-video border border-line overflow-hidden mb-20 bg-paper">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/JtBPL25Qp6U"
            title="RAPID Tutorial - How to Order on Sugargoo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </Reveal>

        {/* Steps 01 / 02 */}
        <Reveal as="section" className="grid grid-cols-1 md:grid-cols-2 border-t border-line mb-2">
          <div className="border-b md:border-r border-line py-8 md:pr-10">
            <span className="font-mono text-sm text-stamp">01</span>
            <h3 className="font-display font-black text-2xl mt-3 mb-3">Create your account</h3>
            <p className="text-ink/75 leading-relaxed mb-5">
              Join Sugargoo using our invitation link to unlock verified-warehouse
              features and batch shopping options.
            </p>
            <Link href="/signup" className="btn-secondary">Create account</Link>
          </div>
          <div className="border-b border-line py-8 md:pl-10">
            <span className="font-mono text-sm text-stamp">02</span>
            <h3 className="font-display font-black text-2xl mt-3 mb-3">Browse our index</h3>
            <p className="text-ink/75 leading-relaxed mb-5">
              Explore 1,500+ sellers and 3 million products, organised by category
              so you can actually find what you&apos;re after.
            </p>
            <Link href="/fashion-listings" className="btn-secondary">View listings</Link>
          </div>
        </Reveal>

        {/* Step 03 */}
        <Reveal as="section" className="border-b border-line pb-16 mb-20">
          <div className="py-8">
            <span className="font-mono text-sm text-stamp">03</span>
            <h3 className="font-display font-black text-2xl mt-3">Ordering through Sugargoo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {ORDER_STEPS.map((step) => (
              <div key={step.n} className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-xs text-muted">{step.n}</span>
                  <span className="text-stamp">{ICONS[step.icon]}</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-2">{step.title}</h4>
                <p className="text-sm text-ink/70 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* FAQ */}
        <Reveal as="section" className="max-w-3xl mb-20">
          <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest mb-10">
            Frequently asked
          </h2>
          <div className="border-t border-line">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group border-b border-line py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-semibold text-lg pr-6">{faq.q}</span>
                  <span className="font-mono text-stamp shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-ink/70 leading-relaxed mt-4 max-w-2xl">{faq.a}</p>
              </details>
            ))}
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal as="section" className="bg-dusk text-stone p-10 md:p-14 text-center">
          <h3 className="font-display font-black text-3xl md:text-4xl tracking-tightest mb-5">
            Ready to get started?
          </h3>
          <Link href="/signup" className="btn-stamp">
            Create your account now
          </Link>
        </Reveal>
      </div>
    </>
  );
}
