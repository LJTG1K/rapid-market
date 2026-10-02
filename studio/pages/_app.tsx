import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { StudioProvider } from '../components/StudioContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const { pathname } = useRouter();
  // The login page renders outside the provider: it has no session to load with.
  if (pathname === '/login') return <Component {...pageProps} />;
  return (
    <StudioProvider>
      <Component {...pageProps} />
    </StudioProvider>
  );
}
