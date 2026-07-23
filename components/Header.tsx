import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Primary links stay flat in the bar (with their 01–03 numerals).
const PRIMARY = [
  { href: '/fashion-listings', label: 'Fashion' },
  { href: '/tech-listings', label: 'Tech' },
  { href: '/brands', label: 'Brands' },
];

// Secondary links are grouped under the "More" dropdown to de-clutter the bar.
const MORE = [
  { href: '/gillys-picks', label: "Gilly's Picks" },
  { href: '/tutorial', label: 'Tutorial' },
  { href: '/blog', label: 'Journal' },
];

// Full list (used by the mobile menu, which shows everything inline).
const ALL_NAV = [...PRIMARY, ...MORE];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const isCampaign = router.pathname === '/campaign';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the "More" dropdown on outside-click or Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  // Close the dropdown whenever navigation occurs.
  useEffect(() => {
    setMoreOpen(false);
  }, [router.asPath]);

  const moreActive = MORE.some((m) => router.pathname.startsWith(m.href));

  return (
    <header
      className={`sticky top-0 z-50 bg-stone/95 backdrop-blur-sm transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_1px_0_0_rgba(27,26,20,0.12)]' : ''
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
              {PRIMARY.map((item, i) => (
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

              {/* More dropdown */}
              <span className="flex items-center">
                <span className="w-px h-3 bg-line mx-4 xl:mx-5" aria-hidden="true" />
                <div className="relative" ref={moreRef}>
                  <button
                    type="button"
                    onClick={() => setMoreOpen((v) => !v)}
                    aria-haspopup="true"
                    aria-expanded={moreOpen}
                    className={`group inline-flex items-center gap-1.5 py-2 font-mono text-[13px] font-medium uppercase tracking-wide transition-colors ${
                      moreActive || moreOpen ? 'text-ink' : 'text-ink/70 hover:text-ink'
                    }`}
                  >
                    More
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {moreOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 min-w-[190px] bg-paper border border-line shadow-[0_12px_30px_-12px_rgba(27,26,20,0.35)] py-1.5 z-50"
                    >
                      {MORE.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setMoreOpen(false)}
                          className="block px-4 py-2.5 font-mono text-[13px] uppercase tracking-wide text-ink/75 hover:text-ink hover:bg-stone/60 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </span>
            </nav>

            {/* Right side: CTAs */}
            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  href="/account"
                  className="hidden sm:inline-flex items-center gap-2 font-mono text-[13px] font-medium uppercase tracking-wide text-ink/70 hover:text-ink transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
                  </svg>
                  {user.name || 'Account'}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex font-mono text-[13px] font-medium uppercase tracking-wide text-ink/70 hover:text-ink transition-colors"
                  >
                    Log in
                  </Link>
                  <Link href="/signup" className="hidden sm:inline-flex btn-primary">
                    Sign Up
                  </Link>
                </>
              )}

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
            {ALL_NAV.map((item, i) => (
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
            {user ? (
              <Link
                href="/account"
                className="btn-primary mt-5 w-full"
                onClick={() => setIsOpen(false)}
              >
                {user.name ? `${user.name} — Account` : 'My Account'}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-secondary mt-5 w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary mt-3 w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
