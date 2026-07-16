import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

interface SignupResponse {
  success?: boolean;
  userId?: string;
  email?: string;
  password?: string;
  error?: string;
  code?: number;
}

export default function SugargooSignUpTest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      // Fire Meta pixel before API call
      if ((window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout', {
          value: 0.00,
          currency: 'AUD',
        });
      }

      const response = await fetch('/api/sugargoo/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
        }),
      });

      const data: SignupResponse = await response.json();

      if (!response.ok) {
        if (data.code === 40910) {
          setError('This email is already registered. Log in or try another email.');
        } else if (data.code === 40011) {
          setError('Invalid email format. Please check and try again.');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
        return;
      }

      // Fire Meta pixel CompleteRegistration on success
      if ((window as any).fbq) {
        (window as any).fbq('track', 'CompleteRegistration', {
          value: 0.00,
          currency: 'AUD',
          userId: data.userId,
        });
      }

      // Success!
      setSuccess(true);
      setGeneratedPassword(data.password || '');
      setEmail('');
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
        <title>Access Exclusive Sellers - RAPID × Sugargoo</title>
        <meta name="description" content="Get instant access to 100+ verified sellers on Sugargoo" />
      </Head>

      <div className="bg-white min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-gray-200 sticky top-0 bg-white z-50">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-black text-lg">
              RAPID
            </Link>
            <Link href="/" className="text-gray-600 hover:text-black text-sm font-semibold">
              Back Home
            </Link>
          </div>
        </nav>

        {/* Main Container */}
        <div className="flex-1 flex items-center justify-center py-12 md:py-20">
          <div className="w-full max-w-2xl px-4">
            {/* OPTIMIZATION #5: 3-Step Timeline */}
            <div className="mb-12">
              <div className="flex gap-4 md:gap-8 justify-between">
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white rounded-full flex items-center justify-center font-black mx-auto mb-2 text-sm md:text-base">
                    1
                  </div>
                  <p className="text-xs md:text-sm font-bold">Create Account</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-black mx-auto mb-2 text-sm md:text-base">
                    2
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">Browse Sellers</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-black mx-auto mb-2 text-sm md:text-base">
                    3
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">Place Order</p>
                </div>
              </div>
              {/* Timeline connector */}
              <div className="flex gap-4 md:gap-8 mt-6 px-1">
                <div className="flex-1 h-1 bg-black"></div>
                <div className="flex-1 h-1 bg-gray-300"></div>
              </div>
            </div>

            {/* OPTIMIZATION #1: Trust Signals */}
            {!success && (
              <div className="mb-10">
                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
                  {/* Seller Count */}
                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <p className="text-2xl md:text-3xl font-black text-black">100+</p>
                    <p className="text-xs md:text-sm text-gray-600 font-semibold mt-1">Verified Sellers</p>
                  </div>
                  
                  {/* Users */}
                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <p className="text-2xl md:text-3xl font-black text-black">50K+</p>
                    <p className="text-xs md:text-sm text-gray-600 font-semibold mt-1">Active Users</p>
                  </div>
                  
                  {/* Verified Badge */}
                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <p className="text-lg md:text-xl mb-1">🔒</p>
                    <p className="text-xs md:text-sm text-gray-600 font-semibold">Secure & Verified</p>
                  </div>
                </div>

                {/* Testimonials - Quick Trust */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-xs md:text-sm text-blue-900 font-semibold mb-2">✨ Trusted by thousands</p>
                  <p className="text-xs md:text-sm text-blue-800 italic">
                    "Instant access, zero hassle. Best way to shop bulk items."
                  </p>
                  <p className="text-xs text-blue-700 mt-2">— Maria, Sydney</p>
                </div>
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="mb-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg">
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-black mb-4">✅ You're In!</p>
                  <div className="bg-white border-2 border-gray-200 rounded p-4 mb-4 text-left">
                    <p className="text-xs md:text-sm text-gray-600 mb-2">Your login credentials:</p>
                    <div className="font-mono text-xs md:text-sm bg-gray-50 p-3 rounded mb-2 break-all">
                      <p className="mb-2">
                        <strong>Email:</strong> {email || '(your email)'}
                      </p>
                      <p>
                        <strong>Password:</strong>{' '}
                        <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                          {generatedPassword}
                        </code>
                      </p>
                    </div>
                  </div>
                  <p className="text-green-700 font-semibold mb-4 text-sm md:text-base">
                    Ready to browse 100+ sellers!
                  </p>
                  <a
                    href="https://www.sugargoo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg mb-3 w-full text-center text-sm md:text-base"
                  >
                    Start Shopping Now →
                  </a>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                      setGeneratedPassword('');
                    }}
                    className="text-gray-600 hover:underline font-semibold text-xs md:text-sm"
                  >
                    Create another account
                  </button>
                </div>
              </div>
            )}

            {!success ? (
              <>
                {/* Headline */}
                <div className="mb-8 text-center">
                  <h1 className="text-3xl md:text-4xl font-black mb-3 uppercase">Access Exclusive Sellers</h1>
                  <p className="text-base md:text-lg text-gray-700">
                    Instant Sugargoo account. No verification needed. Start in 30 seconds.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                    <p className="text-red-700 font-semibold text-sm md:text-base">{error}</p>
                  </div>
                )}

                {/* OPTIMIZATION #2 & #3: Simplified Form + Mobile Optimized */}
                <form onSubmit={handleSubmit} className="mb-8">
                  {/* Email - Full Width, Auto Focus */}
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-bold mb-2">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-4 border-2 border-black rounded-lg focus:outline-none focus:bg-gray-50 text-base md:text-lg"
                      required
                      disabled={loading}
                      autoFocus
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Password will be auto-generated and shown after signup.
                    </p>
                  </div>

                  {/* OPTIMIZATION #4: Stronger CTA Copy */}
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-black py-4 rounded-lg uppercase transition-colors text-base md:text-lg font-bold"
                  >
                    {loading ? 'Creating Account...' : 'Access Exclusive Sellers'}
                  </button>
                </form>

                {/* Info Box - Why RAPID */}
                <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-6">
                  <h3 className="font-black text-lg mb-4">Why RAPID?</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="text-lg">⚡</span>
                      <span>Instant account (no email verification needed)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-lg">🔐</span>
                      <span>Secure password auto-generated & shown immediately</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-lg">🛍️</span>
                      <span>Browse 100+ sellers right after signup</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-lg">⏱️</span>
                      <span>Takes less than 30 seconds total</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-6 mt-8">
          <div className="max-w-2xl mx-auto px-4 text-center text-xs md:text-sm text-gray-600">
            <p>
              RAPID × Sugargoo • {' '}
              <a href="/" className="hover:underline font-semibold">
                Privacy Policy
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
