import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StyleQuizBanner from '@/components/StyleQuizBanner';
import { AuthProvider } from '@/contexts/AuthContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { captureAttribution } from '@/lib/attribution';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Captures utm_source/medium/campaign (or infers a channel from a
  // dedicated landing page like /reddit) on the entry page and on every
  // client-side route change, so a signup submitted several pages later can
  // still be attributed. See lib/attribution.ts.
  useEffect(() => {
    captureAttribution();
    router.events.on('routeChangeComplete', captureAttribution);
    return () => router.events.off('routeChangeComplete', captureAttribution);
  }, [router.events]);

  return (
    <AuthProvider>
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
