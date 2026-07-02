import type { AppProps } from 'next/app';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Component {...pageProps} />
      </main>
      <Footer />
    </div>
  );
}
