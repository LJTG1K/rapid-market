import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StyleQuizBanner from '@/components/StyleQuizBanner';
import { AuthProvider } from '@/contexts/AuthContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { captureAttribution, captureRedditClickId } from '@/lib/attribution';
import { CANONICAL_ORIGIN } from '@/lib/siteUrl';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Captures utm_source/medium/campaign (or infers a channel from a
  // dedicated landing page like /reddit) on the entry page and on every
  // client-side route change, so a signup submitted several pages later can
  // still be attributed. See lib/attribution.ts.
  useEffect(() => {
    captureAttribution();
    captureRedditClickId();
    const captureAll = () => {
      captureAttribution();
      captureRedditClickId();
    };
    router.events.on('routeChangeComplete', captureAll);
    return () => router.events.off('routeChangeComplete', captureAll);
  }, [router.events]);

  // Path only — query strings (UTMs, filters) don't belong in a share URL.
  const pageUrl = `${CANONICAL_ORIGIN}${router.asPath.split(/[?#]/)[0]}`;

  return (
    <AuthProvider>
      {/* Site-wide defaults. A page overrides any of these from its own
          <Head>: `name` metas are de-duplicated automatically (the page's
          wins), `property` metas only when the page reuses the same `key`. */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="RAPID - Access 150+ sellers, with new items indexed daily, through Sugargoo" />
        <meta property="og:site_name" content="RAPID" key="og:site_name" />
        <meta property="og:title" content="RAPID. - Direct from China" key="og:title" />
        <meta property="og:description" content="150+ sellers, new items indexed daily. Shipped via Sugargoo. No middleman, no markup." key="og:description" />
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:url" content={pageUrl} key="og:url" />
        <meta property="og:image" content={`${CANONICAL_ORIGIN}/assets/og-default.jpg`} key="og:image" />
        <meta property="og:image:alt" content="RAPID — streetwear sourced direct from independent sellers" key="og:image:alt" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RAPID. - Direct from China" />
        <meta name="twitter:description" content="150+ sellers, new items indexed daily. Shipped via Sugargoo." />
        <meta name="twitter:image" content={`${CANONICAL_ORIGIN}/assets/og-default.jpg`} />
      </Head>
      <WishlistProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <StyleQuizBanner />
          <main className="flex-1">
            <Component {...pageProps} />
          </main>
          <Footer />
        </div>
      </WishlistProvider>
    </AuthProvider>
  );
}
