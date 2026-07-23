import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Reveal from '@/components/Reveal';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const nextPath = typeof router.query.next === 'string' ? router.query.next : '/account';

  // Already logged in → skip the form.
  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, user, nextPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      await refresh();
      router.replace(nextPath);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Log In — RAPID × Sugargoo</title>
        <meta name="description" content="Log in to your RAPID account" />
      </Head>

      <div className="container-edit py-16 md:py-24">
        <Reveal className="max-w-md mx-auto">
          <span className="eyebrow block text-center mb-3">Welcome Back</span>
          <h1 className="font-display font-black text-ink text-5xl md:text-6xl tracking-tightest text-center leading-[0.9] mb-4">
            Log in
          </h1>
          <p className="text-ink/70 text-center mb-12">
            Use the same email and password as your Sugargoo account.
          </p>

          {error && (
            <div className="mb-6 p-4 border-l-2 border-stamp bg-paper">
              <p className="text-ink text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 mb-10">
            <div>
              <label htmlFor="email" className="eyebrow block mb-2">Email address *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="eyebrow block mb-2">Password *</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your Sugargoo password"
                  className="w-full pl-4 pr-12 py-3 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted hover:text-ink transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-stamp w-full disabled:opacity-50">
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="border-t border-line pt-8 text-center">
            <p className="text-sm text-ink/70 mb-4">Don&apos;t have an account yet?</p>
            <Link href="/signup" className="btn-secondary">Create account</Link>
          </div>

          <div className="text-center mt-12">
            <Link href="/" className="link-underline font-mono text-xs uppercase tracking-wide">
              ← Back home
            </Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}
