import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FASHION_CATEGORIES, TECH_CATEGORIES, DISCOVER_LINKS, HELP_LINKS } from '@/lib/navCategories';

/**
 * Header (Direction A, layout L3). Links are grouped by what they are:
 *   Shop      one "Shop" button opening a panel with every Fashion and Tech category
 *   Discover  Brands and Gilly's Picks, flat in the bar
 *   Help      Guide and Journal, small and grey on the right
 * Search opens a field that sends the shopper to the fashion listings,
 * pre-filtered. On phones the menu is the same three groups, stacked.
 */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const shopRef = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const isCampaign = ['/campaign', '/reddit'].includes(router.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close everything on navigation.
  useEffect(() => {
    setShopOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [router.asPath]);

  // Shop panel: close on outside click / Escape.
  useEffect(() => {
    if (!shopOpen && !searchOpen) return;
    const onDown = (e: MouseEvent) => {
      if (shopOpen && shopRef.current && !shopRef.current.contains(e.target as Node)) setShopOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShopOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [shopOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/fashion-listings?q=${encodeURIComponent(q)}`);
  };

  const shopActive = ['/fashion-listings', '/tech-listings', '/phone-cases'].some((p) => router.pathname.startsWith(p));
  const linkCls = (active: boolean) =>
    `relative py-2 text-[15px] font-semibold transition-colors ${active ? 'text-ink' : 'text-ink/80 hover:text-ink'}`;

  const SearchIcon = (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3.5 3.5" />
    </svg>
  );

  return (
    <header
      ref={shopRef}
      className={`sticky top-0 z-50 bg-white border-b transition-colors duration-200 ${
        scrolled || shopOpen ? 'border-line' : 'border-transparent'
      }`}
    >
      <div className="container-edit flex items-center gap-6 h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="RAPID home">
          <Image src="/assets/logo.png" alt="" width={26} height={26} className="h-6 w-auto" />
          <span className="font-mark text-xl text-ink">
            RAPID<span className="text-stamp">.</span>
          </span>
        </Link>

        {!isCampaign && (
          <>
            {/* Desktop: Shop + Discover */}
            <nav className="hidden lg:flex items-center gap-7" aria-label="Main">
              <button
                type="button"
                onClick={() => setShopOpen((v) => !v)}
                aria-expanded={shopOpen}
                aria-controls="shop-panel"
                className={`${linkCls(shopOpen || shopActive)} inline-flex items-center gap-1.5`}
              >
                Shop
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 transition-transform ${shopOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {(shopOpen || shopActive) && <span className="absolute left-0 right-0 -bottom-[13px] h-[2px] bg-ink" aria-hidden="true" />}
              </button>
              {DISCOVER_LINKS.map((l) => {
                const active = router.pathname.startsWith(l.href);
                return (
                  <Link key={l.href} href={l.href} className={linkCls(active)}>
                    {l.label}
                    {active && <span className="absolute left-0 right-0 -bottom-[13px] h-[2px] bg-ink" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {/* Desktop: Help, quiet */}
              <span className="hidden xl:flex items-center gap-5 mr-3">
                <Link href="/tutorial" className="text-sm text-muted hover:text-ink transition-colors">Guide</Link>
                <Link href="/blog" className="text-sm text-muted hover:text-ink transition-colors">Journal</Link>
              </span>

              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
                aria-expanded={searchOpen}
                className="w-10 h-10 rounded-full grid place-items-center text-ink hover:bg-paper transition-colors"
              >
                {SearchIcon}
              </button>

              {user ? (
                <Link
                  href="/account"
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-ink hover:bg-paper rounded-full px-3 h-10"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
                  </svg>
                  {user.name || 'Account'}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-ink hover:bg-paper rounded-full px-3 h-10 items-center">
                    Log in
                  </Link>
                  <Link href="/signup" className="btn-primary !py-2.5 !px-4">
                    Sign up
                  </Link>
                </>
              )}

              <button
                className="lg:hidden w-10 h-10 grid place-items-center text-ink"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            </div>
          </>
        )}

        {isCampaign && (
          <Link href="/signup" className="btn-stamp ml-auto">
            Create free account
          </Link>
        )}
      </div>

      {/* Search field */}
      {searchOpen && !isCampaign && (
        <div className="border-t border-line bg-white">
          <form onSubmit={submitSearch} className="container-edit py-3 flex items-center gap-3" role="search">
            <label htmlFor="site-search" className="sr-only">Search brands and items</label>
            <span className="text-muted">{SearchIcon}</span>
            <input
              id="site-search"
              ref={searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brands and items, e.g. Baovicto jacket"
              className="flex-1 min-w-0 bg-transparent text-base outline-none placeholder:text-muted"
              autoComplete="off"
            />
            <button type="submit" className="btn-primary !py-2 !px-4">Search</button>
          </form>
        </div>
      )}

      {/* Desktop Shop panel */}
      {shopOpen && !isCampaign && (
        <div id="shop-panel" className="hidden lg:block absolute left-0 right-0 top-full bg-white border-b border-line shadow-[0_24px_40px_-28px_rgba(14,14,16,0.35)]">
          <div className="container-edit py-8 grid grid-cols-12 gap-8">
            <div className="col-span-3">
              <Link href="/fashion-listings" className="font-display text-lg text-ink hover:underline">Fashion</Link>
              <ul className="mt-4 grid gap-2.5">
                <li><Link href="/fashion-listings" className="text-[15px] text-ink hover:underline">All fashion</Link></li>
                {FASHION_CATEGORIES.map((c) => (
                  <li key={c.href}><Link href={c.href} className="text-[15px] text-ink/80 hover:text-ink hover:underline">{c.label}</Link></li>
                ))}
              </ul>
            </div>
            <div className="col-span-3">
              <Link href="/tech-listings" className="font-display text-lg text-ink hover:underline">Tech</Link>
              <ul className="mt-4 grid gap-2.5">
                <li><Link href="/tech-listings" className="text-[15px] text-ink hover:underline">All tech</Link></li>
                {TECH_CATEGORIES.map((c) => (
                  <li key={c.href}><Link href={c.href} className="text-[15px] text-ink/80 hover:text-ink hover:underline">{c.label}</Link></li>
                ))}
              </ul>
            </div>
            <Link href="/gillys-picks" className="col-span-4 col-start-9 group">
              <div
                className="aspect-[16/10] rounded-md bg-paper bg-no-repeat mb-3"
                style={{ backgroundImage: 'url(/carousel-3.jpg)', backgroundSize: '345% auto', backgroundPosition: '47.5% 32%' }}
                role="img"
                aria-label="Varsity jacket picked by Gilly"
              />
              <p className="font-display text-lg text-ink group-hover:underline">Gilly&apos;s Picks</p>
              <p className="text-sm text-muted">Pieces Gilly wore first, with notes on fit.</p>
            </Link>
          </div>
        </div>
      )}

      {/* Mobile menu: Shop / Discover / Help */}
      {mobileOpen && !isCampaign && (
        <nav className="lg:hidden border-t border-line bg-white max-h-[calc(100vh-4rem)] overflow-y-auto" aria-label="Main">
          <div className="container-edit py-6 grid gap-7">
            <div>
              <p className="eyebrow mb-2">Shop</p>
              <Link href="/fashion-listings" className="block font-display text-2xl text-ink py-1">Fashion</Link>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {FASHION_CATEGORIES.map((c) => (
                  <Link key={c.href} href={c.href} className="tag">{c.label}</Link>
                ))}
              </div>
              <Link href="/tech-listings" className="block font-display text-2xl text-ink py-1">Tech</Link>
            </div>
            <div>
              <p className="eyebrow mb-2">Discover</p>
              {DISCOVER_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="block font-display text-2xl text-ink py-1">{l.label}</Link>
              ))}
            </div>
            <div>
              <p className="eyebrow mb-2">Help</p>
              {HELP_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="block text-base text-muted py-1.5">{l.label}</Link>
              ))}
            </div>
            <div className="grid gap-3 pt-2">
              {user ? (
                <Link href="/account" className="btn-primary w-full">{user.name ? `${user.name}: account` : 'Your account'}</Link>
              ) : (
                <>
                  <Link href="/signup" className="btn-primary w-full">Sign up</Link>
                  <Link href="/login" className="btn-secondary w-full">Log in</Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
