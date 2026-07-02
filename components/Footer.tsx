import Link from 'next/link';
import { useRouter } from 'next/router';
import Stamp from './Stamp';

export default function Footer() {
  const router = useRouter();
  const isCampaign = router.pathname === '/campaign';

  if (isCampaign) {
    return (
      <footer className="bg-dusk text-stone/60 mt-0">
        <div className="container-edit py-8 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <p className="font-mono text-xs uppercase tracking-wide">
            &copy; {new Date().getFullYear()} RAPID Market
          </p>
          <Link href="/privacy" className="font-mono text-xs uppercase tracking-wide hover:text-stamp transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-dusk text-stone mt-24">
      <div className="container-edit pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Wordmark + mission */}
          <div className="lg:col-span-5">
            <p className="font-display font-black text-4xl tracking-tightest mb-4">
              RAPID<span className="text-stamp">.</span>
            </p>
            <p className="text-stone/70 max-w-sm leading-relaxed">
              Your gateway to 1,500+ independent Chinese sellers, indexed and
              made ready to ship — no middleman, no markup.
            </p>
          </div>

          {/* Browse */}
          <div className="lg:col-span-2">
            <h3 className="eyebrow text-stone/50 mb-4">Browse</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/fashion-listings" className="hover:text-stamp transition-colors">Fashion</Link></li>
              <li><Link href="/tech-listings" className="hover:text-stamp transition-colors">Tech</Link></li>
              <li><Link href="/brands" className="hover:text-stamp transition-colors">Brand Index</Link></li>
              <li><Link href="/gillys-picks" className="hover:text-stamp transition-colors">Gilly&apos;s Picks</Link></li>
            </ul>
          </div>

          {/* Guide */}
          <div className="lg:col-span-2">
            <h3 className="eyebrow text-stone/50 mb-4">Start here</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/signup" className="hover:text-stamp transition-colors">Create Account</Link></li>
              <li><Link href="/tutorial" className="hover:text-stamp transition-colors">Ordering Guide</Link></li>
              <li><Link href="/blog" className="hover:text-stamp transition-colors">Journal</Link></li>
              <li><Link href="/campaign" className="hover:text-stamp transition-colors">Campaign</Link></li>
              <li><Link href="/privacy" className="hover:text-stamp transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Stamp */}
          <div className="lg:col-span-3 flex lg:justify-end items-start">
            <Stamp
              ringText="RAPID MARKET · EST. SHENZHEN ·"
              centerText="到"
              sub="RAPID.MARKET"
              size={112}
            />
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-stone/15 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <p className="font-mono text-xs uppercase tracking-wide text-stone/50">
            &copy; {new Date().getFullYear()} RAPID Market. All rights reserved.
          </p>
          <p className="font-mono text-xs uppercase tracking-wide text-stone/50">
            rapid.market
          </p>
        </div>
      </div>
    </footer>
  );
}
