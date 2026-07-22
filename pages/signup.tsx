import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Reveal from '@/components/Reveal';
import Stamp from '@/components/Stamp';

interface SignupResponse {
  success?: boolean;
  userId?: string;
  email?: string;
  password?: string;
  error?: string;
  code?: number;
}

export default function SugargooSignUp() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

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
              <div className="bg-stone/60 border border-line p-4 mb-6 text-left">
                <p className="font-mono text-xs uppercase tracking-wide text-muted mb-2">Your login credentials</p>
                <p className="text-sm mb-1"><strong>Email:</strong> {submittedEmail || '(your email)'}</p>
                <p className="text-sm">
                  <strong>Password:</strong>{' '}
                  <code className="font-mono text-xs bg-paper px-2 py-1 border border-line">{generatedPassword}</code>
                </p>
              </div>
              <p className="text-ink/80 mb-6">You&apos;re ready to start shopping on Sugargoo.</p>
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
    </>
  );
}
