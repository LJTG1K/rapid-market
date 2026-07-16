import Head from 'next/head';
import { useState, useEffect } from 'react';

interface Review {
  author: string;
  rating: number;
  text: string;
  helpfulVotes: number;
}

const handleSignupClick = (url: string) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'CompleteRegistration', {
        value: 0.00,
        currency: 'AUD',
        status: 'completed'
      });
    }
    window.open(url, '_blank');
  };

export default function LandingPageTest1() {
  const [topReviews, setTopReviews] = useState<Review[]>([]);

  useEffect(() => {
    setTopReviews([
      {
        author: 'Verified Buyer',
        rating: 5,
        text: 'Best seller on RAPID. Quality is unbeatable at this price point.',
        helpfulVotes: 847,
      },
      {
        author: 'Verified Buyer',
        rating: 5,
        text: 'Fast shipping, perfect QC photos, exactly as described. Highly recommend.',
        helpfulVotes: 312,
      },
      {
        author: 'Verified Buyer',
        rating: 5,
        text: 'Ordered from 5 different sellers. All exceeded expectations. RAPID is the real deal.',
        helpfulVotes: 1200,
      },
    ]);
  }, []);

  return (
    <>
      <Head>
        <title>RAPID. - Discover 1500+ Verified Sellers</title>
        <meta name="description" content="Authentic brands at factory prices. No middleman. No markup." />
      </Head>

      {/* TOP NAV CTA */}
      <div className="bg-blue-600 text-white py-3 px-4 text-center">
        <button
          onClick={() => handleSignupClick('https://www.sugargoo.com/register?memberId=3229302312621422771')}
          className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
          style={{ fontFamily: 'Jaro' }}
        >
          Sign Up & Browse
        </button>
      </div>

      {/* HERO SECTION - White */}
      <section className="bg-white px-4 relative flex flex-col items-center justify-center min-h-[480px]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 px-4 py-2 rounded-full mb-4 text-sm font-bold">
              ► 15,234 Active Buyers This Month
            </div>
            <div className="inline-block bg-blue-100 px-4 py-2 rounded-full ml-2 text-sm font-bold">
              ► Verified Sellers • Rated 4.8★
            </div>
          </div>

          <h1
            className="text-5xl md:text-6xl font-black text-center mb-6 uppercase leading-tight"
            style={{ fontFamily: 'Jaro' }}
          >
            RAPID: Buy Direct From <br /> 1500+ Verified Sellers
          </h1>

          <p
            className="text-xl text-center text-gray-700 mb-12 max-w-2xl mx-auto"
            style={{ fontFamily: 'Staatliches' }}
          >
            Transparent verification. Real buyer reviews. Dispute protection.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => window.location.href = '/fashion-listings'}
              className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-colors uppercase"
              style={{ fontFamily: 'Jaro' }}
            >
              Browse Sellers
            </button>
            <button
              onClick={() => window.location.href = '/gillys-picks'}
              className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-colors uppercase"
              style={{ fontFamily: 'Jaro' }}
            >
              See Latest Hauls
            </button>
          </div>
        </div>

      </section>

      {/* REAL BUYER PROOF - Light Gray */}
      <section className="bg-gray-100 px-4 relative flex flex-col items-center justify-center min-h-[520px]">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center mb-4 uppercase"
            style={{ fontFamily: 'Jaro' }}
          >
            100+ 5 Star Reviews
          </h2>
          <p className="text-center text-gray-700 mb-16 text-lg">100+ original brands and counting</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {topReviews.map((review, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-base text-gray-700 mb-6" style={{ fontFamily: 'Staatliches' }}>
                  "{review.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY RAPID - White */}
      <section className="bg-white px-4 relative flex flex-col items-center justify-center min-h-[480px]">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center mb-16 uppercase"
            style={{ fontFamily: 'Jaro' }}
          >
            Why RAPID?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-100 p-8 rounded-2xl text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl font-black mb-4">✓</div>
              <h3 className="text-xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>
                Verified Sellers
              </h3>
              <p className="text-sm text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                ID verified and business licensed
              </p>
            </div>

            <div className="bg-green-100 p-8 rounded-2xl text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl font-black mb-4">4.8★</div>
              <h3 className="text-xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>
                Avg Seller Rating
              </h3>
              <p className="text-sm text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Based on 1,000+ verified reviews
              </p>
            </div>

            <div className="bg-yellow-100 p-8 rounded-2xl text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl font-black mb-4">24/7</div>
              <h3 className="text-xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>
                Support
              </h3>
              <p className="text-sm text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Questions? We're here to help
              </p>
            </div>

            <div className="bg-red-100 p-8 rounded-2xl text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl font-black mb-4">99.2%</div>
              <h3 className="text-xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>
                Disputes Resolved
              </h3>
              <p className="text-sm text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Within 7 days or full refund
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* HOW IT WORKS - Light Blue */}
      <section className="bg-blue-50 py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 uppercase" style={{ fontFamily: 'Jaro' }}>
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-6xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>1</div>
              <h3 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>Find & Buy</h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Browse 1500+ sellers. See ratings & reviews.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>2</div>
              <h3 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>Seller Ships</h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Verify w/ QC photos. Escrow holds payment.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>3</div>
              <h3 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>Dispute Protected</h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                99.2% of disputes resolved within 7 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION - White */}
      <section className="bg-white px-4 relative flex flex-col items-center justify-center min-h-[480px]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase" style={{ fontFamily: 'Jaro' }}>
            Ready for Your First Purchase?
          </h2>

          <p className="text-lg text-gray-700 mb-8" style={{ fontFamily: 'Staatliches' }}>
            Join 15,234+ buyers this month. 4.8★ average seller rating.
          </p>

          <button
            onClick={() => handleSignupClick('https://www.sugargoo.com/register?memberId=3229302312621422771')}
            className="bg-black text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-colors uppercase"
            style={{ fontFamily: 'Jaro' }}
          >
            Start Shopping
          </button>
        </div>
      </section>
    </>
  );
}
