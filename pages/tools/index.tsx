import Head from 'next/head';
import Link from 'next/link';
import Reveal from '@/components/Reveal';

const ICONS: Record<string, JSX.Element> = {
  ship: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-7 h-7">
      <path d="M5 15h22l-3 10H8L5 15z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 15V7h10v8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3v4" strokeLinecap="round" />
    </svg>
  ),
};

interface Tool {
  n: string;
  icon: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  live: boolean;
}

const TOOLS: Tool[] = [
  {
    n: '01',
    icon: 'ship',
    title: 'Shipping Calculator',
    body: 'Pick your country, enter your parcel’s weight and size, and compare every Sugargoo shipping line — price and delivery time side by side.',
    href: '/tools/shipping',
    cta: 'Open calculator',
    live: true,
  },
];

export default function ToolsHub() {
  return (
    <>
      <Head>
        <title>Tools — RAPID Marketplace</title>
        <meta name="description" content="Free tools for ordering through Sugargoo and RAPID — shipping cost calculators and more." />
        <link rel="canonical" href="https://rapid.market/tools" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <span className="eyebrow block mb-3">Resources</span>
        <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-6 max-w-3xl">
          Tools
        </h1>
        <p className="text-ink/75 leading-relaxed max-w-2xl mb-14">
          Free, independent tools to make ordering through Sugargoo easier — starting with shipping cost estimates,
          with more on the way.
        </p>

        <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 border-t border-line pt-10">
          {TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group card p-6 block hover:border-ink transition-colors">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-xs text-muted">{tool.n}</span>
                <span className="text-stamp">{ICONS[tool.icon]}</span>
              </div>
              <h2 className="font-display font-bold text-lg mb-2 group-hover:text-stamp transition-colors">
                {tool.title}
              </h2>
              <p className="text-sm text-ink/70 leading-relaxed mb-5">{tool.body}</p>
              <span className="font-mono text-xs uppercase tracking-wide text-ink link-underline">{tool.cta}</span>
            </Link>
          ))}
        </Reveal>
      </div>
    </>
  );
}
