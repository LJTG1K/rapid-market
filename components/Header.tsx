import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/fashion-listings', label: 'Fashion' },
  { href: '/tech-listings', label: 'Tech' },
  { href: '/brands', label: 'Brands' },
  { href: '/gillys-picks', label: "Gilly's Picks" },
  { href: '/tutorial', label: 'Tutorial' },
  { href: '/blog', label: 'Journal' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const isCampaign = router.pathname === '/campaign';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-stone/95 backdrop-blur-sm transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_1px_0_0_rgba(32,30,25,0.12)]' : ''
      }`}
    >
      <div
        className={`container-edit flex items-center justify-between transition-[height] duration-300 ${
          scrolled ? 'h-[58px]' : 'h-[72px]'
        }`}
      >
        {/* Logotype */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/assets/logo.png"
            alt="RAPID"
            width={28}
            height={28}
            className="h-7 w-auto"
          />
          <span className="font-display font-black text-xl tracking-tightest text-ink">
            RAPID<span className="text-stamp">.</span>
          </span>
        </Link>

        {!isCampaign && (
          <>
            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center">
              {NAV.map((item, i) => (
                <span key={item.href} className="flex items-center">
                  {i > 0 && <span className="w-px h-3 bg-line mx-4 xl:mx-5" aria-hidden="true" />}
                  <Link
                    href={item.href}
                    className="group relative py-2 font-mono text-[13px] font-medium uppercase tracking-wide text-ink/70 hover:text-ink transition-colors"
                  >
                    <span className="text-stamp mr-1.5">{String(i + 1).padStart(2, '0')}</span>
                    {item.label}
                    <span
                      className="absolute left-0 -bottom-0.5 h-px w-full bg-stamp origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </Link>
                </span>
              ))}
            </nav>

            {/* Right meta + CTA */}
            <div className="flex items-center gap-5">
              <span className="hidden xl:flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-stamp motion-safe:animate-pulse" aria-hidden="true" />
                100+ sellers live
              </span>
              <Link href="/signup" className="hidden sm:inline-flex btn-primary">
                Sign Up
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden flex flex-col justify-center items-center gap-[5px] w-11 h-11 shrink-0"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
              >
                <span className={`block h-[1.5px] w-6 bg-ink transition-transform ${isOpen ? 'translate-y-[6.5px] rotate-45' : ''}`} />
                <span className={`block h-[1.5px] w-6 bg-ink transition-opacity ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`block h-[1.5px] w-6 bg-ink transition-transform ${isOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
              </button>
            </div>
          </>
        )}

        {isCampaign && (
          <Link href="/signup" className="btn-stamp">
            Create Free Account
          </Link>
        )}
      </div>

      <div className="perforated" />

      {/* Mobile Nav */}
      {!isCampaign && isOpen && (
        <nav className="lg:hidden bg-stone border-b border-line">
          <div className="container-edit flex flex-col py-4">
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center font-mono text-sm uppercase tracking-wide py-3.5 border-b border-line/60 text-ink"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-stamp mr-3">{String(i + 1).padStart(2, '0')}</span>
                {item.label}
              </Link>
            ))}
            <Link
              href="/signup"
              className="btn-primary mt-5 w-full"
              onClick={() => setIsOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
