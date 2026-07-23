import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Reveal from '@/components/Reveal';
import Stamp from '@/components/Stamp';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';

interface SignupResponse {
  success?: boolean;
  userId?: string;
  email?: string;
  password?: string;
  error?: string;
  code?: number;
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: string;
  sugargooLink: string;
}

function SignupProductPicks() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((all: Product[]) => {
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        setProducts(shuffled.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <Reveal as="section" className="container-edit py-12 md:py-16 border-t border-line mt-16">
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest max-w-xl">
          While you&apos;re here
        </h2>
        <span className="eyebrow hidden sm:inline">Picks From The Index</span>
      </div>

      {loading ? (
        <ProductGridSkeleton count={3} aspect="4:5" />
      ) : (
        <Reveal stagger={60} className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-10">
          {products.map((p, i) => (
            <div key={p.id} className="flex flex-col">
              <Link href={`/product/${p.id}?category=fashion`} className="group">
                <div className="aspect-[4/5] bg-paper border border-line overflow-hidden mb-3">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <span className="font-mono text-[11px] text-stamp mb-1.5 block">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display font-black text-lg leading-snug mb-3 group-hover:text-stamp transition-colors">
                  {p.name}
                </h3>
              </Link>
              <div className="mt-auto flex items-center justify-between gap-3">
                <span className="font-mono text-sm">{p.price}</span>
                <a
                  href={p.sugargooLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary !px-4 !py-2 text-[11px]"
                >
                  Buy
                </a>
              </div>
            </div>
          ))}
        </Reveal>
      )}
    </Reveal>
  );
}

export default function SugargooSignUp() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable/denied — button just silently stays "Copy".
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      if ((window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout', { value: 0.0, currency: 'AUD' });
      }

      const response = await fetch('/api/sugargoo/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || email.split('@')[0] }),
      });

      const data: SignupResponse = await response.json();

      if (!response.ok) {
        if (data.code === 40910) {
          setError('This email is already registered. Log in or try another email.');
        } else if (data.code === 40011) {
          setError('Invalid email format. Please check and try again.');
        } else if (data.code === 40012) {
          setError('Password must be 6-64 characters.');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
        return;
      }

      if ((window as any).fbq) {
        (window as any).fbq('track', 'CompleteRegistration', { value: 0.0, currency: 'AUD', userId: data.userId });
      }

      setSuccess(true);
      setSubmittedEmail(email);
      setGeneratedPassword(data.password || '');
      setEmail('');
      setName('');
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up — RAPID × Sugargoo</title>
        <meta name="description" content="Create your Sugargoo account in seconds" />
      </Head>

      <div className="container-edit py-16 md:py-24">
        <Reveal className="max-w-md mx-auto">
          <span className="eyebrow block text-center mb-3">Step 01 — Create Account</span>
          <h1 className="font-display font-black text-ink text-5xl md:text-6xl tracking-tightest text-center leading-[0.9] mb-4">
            Join RAPID
          </h1>
          <p className="text-ink/70 text-center mb-12">
            Instant Sugargoo account creation. No email verification needed.
          </p>

          {success ? (
            <div className="card p-8 text-center">
              <Stamp
                size={56}
                spin={false}
                centerText="OK"
                sub="Verified"
                ringText="Sugargoo · Account Created ·"
                className="mx-auto mb-4"
              />
              <p className="eyebrow text-stamp mb-4">Account created</p>
              <p className="text-sm text-ink/70 mb-6 leading-relaxed">
                This is your real Sugargoo login — the same one you&apos;ll use every time you shop,
                not a temporary code. We&apos;ve also sent it to your email so you don&apos;t lose it.
              </p>
              <div className="bg-stone/60 border border-line p-4 mb-6 text-left">
                <p className="font-mono text-xs uppercase tracking-wide text-muted mb-2">Your login credentials</p>
                <p className="text-sm mb-1"><strong>Email:</strong> {submittedEmail || '(your email)'}</p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm">
                    <strong>Password:</strong>{' '}
                    <code className="font-mono text-xs bg-paper px-2 py-1 border border-line">{generatedPassword}</code>
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-muted hover:text-ink transition-colors"
                  >
                    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                      <rect x="10" y="10" width="16" height="18" rx="1.5" strokeLinejoin="round" />
                      <path d="M6 22V6a2 2 0 0 1 2-2h12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="text-left mb-6">
                <p className="font-mono text-xs uppercase tracking-wide text-muted mb-3">What happens next</p>
                <ol className="space-y-2 text-sm text-ink/75">
                  <li className="flex gap-3">
                    <span className="font-mono text-stamp shrink-0">01</span>
                    <span>Log in to Sugargoo with these details.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono text-stamp shrink-0">02</span>
                    <span>Browse the RAPID index and add items to your cart.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono text-stamp shrink-0">03</span>
                    <span>Sugargoo consolidates and ships everything to your door.</span>
                  </li>
                </ol>
              </div>

              <p className="text-xs text-ink/60 mb-6 leading-relaxed">
                Most new members place their first order within 10 minutes — first orders often
                qualify for a shipping discount, so it&apos;s worth checking your Sugargoo account now.
              </p>

              <a
                href="https://www.sugargoo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-stamp w-full mb-4"
              >
                Go to Sugargoo →
              </a>
              <button
                onClick={() => {
                  setSuccess(false);
                  setSubmittedEmail('');
                  setGeneratedPassword('');
                }}
                className="link-underline font-mono text-xs uppercase tracking-wide"
              >
                Create another account
              </button>
            </div>
          ) : (
            <>
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
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="name" className="eyebrow block mb-2">Username</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="john_doe"
                    className="w-full px-4 py-3 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
                    disabled={loading}
                  />
                </div>

                <p className="font-mono text-xs text-muted">
                  Your password is auto-generated and shown after signup.
                </p>

                <button type="submit" disabled={loading} className="btn-stamp w-full disabled:opacity-50">
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <div className="border-t border-line pt-8">
                <p className="eyebrow mb-4">What happens next</p>
                <ul className="space-y-3 text-sm text-ink/75">
                  <li className="flex gap-3">
                    <span className="font-mono text-stamp shrink-0">01</span>
                    <span>Your Sugargoo account is created instantly — no email verification.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono text-stamp shrink-0">02</span>
                    <span>Your password is generated and shown on this screen right away.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono text-stamp shrink-0">03</span>
                    <span>Sign in at Sugargoo and start shopping the RAPID index immediately.</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          <div className="text-center mt-12">
            <Link href="/" className="link-underline font-mono text-xs uppercase tracking-wide">
              ← Back home
            </Link>
          </div>
        </Reveal>
      </div>

      {success && <SignupProductPicks />}
    </>
  );
}
