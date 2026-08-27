import Head from 'next/head';
import Reveal from '@/components/Reveal';
import ShippingTool from '@/components/tools/ShippingTool';
import type { ShippingIndex } from '@/lib/shipping/types';

export async function getStaticProps() {
  try {
    const indexData = await import('../../public/data/shipping/index.json');
    return { props: { index: indexData.default as ShippingIndex }, revalidate: 3600 };
  } catch (error) {
    console.error('Error loading shipping index:', error);
    return {
      props: {
        index: {
          schemaVersion: 1,
          lastVerified: '',
          sourceNote: '',
          fx: { base: 'USD', asOf: '', rates: {} },
          countries: [],
        } as ShippingIndex,
      },
      revalidate: 60,
    };
  }
}

const FAQS = [
  {
    q: 'How much is Sugargoo shipping to my country?',
    a: 'It depends on your country, the parcel weight, and which shipping line you pick — some are cheaper but slower, others are faster but cost more. Use the calculator above to compare every line Sugargoo offers to your destination side by side.',
  },
  {
    q: 'What is volumetric weight, and why does it matter?',
    a: 'Many shipping lines charge by whichever is greater: the actual weight of your parcel, or a "volumetric weight" calculated from its length × width × height. Light but bulky items (like shoeboxes) often cost more to ship than their scale weight suggests — this calculator accounts for that automatically per line.',
  },
  {
    q: 'Which Sugargoo line is cheapest?',
    a: 'It varies by country and parcel size — sort the results table by "Cheapest" to see the lowest-cost option for your specific weight and dimensions.',
  },
  {
    q: 'Which Sugargoo line is fastest?',
    a: 'Sort by "Fastest" to see delivery-time estimates for each line to your country. Faster lines are almost always more expensive.',
  },
  {
    q: 'Are these prices guaranteed?',
    a: 'No — this tool shows estimates compiled from Sugargoo’s own published shipping calculator, not live pricing. Always confirm the final cost at Sugargoo checkout before paying. See the "last verified" date shown with your results.',
  },
];

export default function ShippingCalculatorPage({ index }: { index: ShippingIndex }) {
  return (
    <>
      <Head>
        <title>Sugargoo Shipping Calculator — Compare Every Line by Country — RAPID Marketplace</title>
        <meta
          name="description"
          content="Compare Sugargoo shipping cost and delivery time for every line to your country. Free calculator with volumetric weight support."
        />
        <link rel="canonical" href="https://rapid.market/tools/shipping" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'WebApplication',
              name: 'Sugargoo Shipping Calculator',
              url: 'https://rapid.market/tools/shipping',
              applicationCategory: 'UtilitiesApplication',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              featureList: [
                'Compare all Sugargoo shipping lines by country',
                'Volumetric weight calculation',
                'Sort by price or delivery speed',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'FAQPage',
              mainEntity: FAQS.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <span className="eyebrow block mb-3">Tools — Estimate</span>
        <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-6 max-w-4xl">
          Sugargoo shipping calculator
        </h1>
        <p className="text-ink/75 leading-relaxed max-w-2xl mb-14">
          Pick your country, enter your parcel&apos;s weight and size, and compare every Sugargoo shipping line —
          price and delivery time side by side.
        </p>

        <Reveal>
          <ShippingTool index={index} />
        </Reveal>

        <Reveal as="section" className="max-w-3xl mt-24">
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
      </div>
    </>
  );
}
