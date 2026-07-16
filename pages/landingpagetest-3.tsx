import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';

interface Brand {
  brandName: string;
  slug: string;
  description: string;
  aesthetic: string[];
  targetCustomer: string;
  notes: string;
}

interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  sugargooLink: string;
  category: string;
  brand: string;
  verified?: boolean;
}

export async function getStaticProps() {
  try {
    const brandsPath = path.join(process.cwd(), 'public', 'data', 'brands.json');
    const brandsData = fs.readFileSync(brandsPath, 'utf-8');
    const allBrands = JSON.parse(brandsData);

    // Select 4 specific brands for the featured section
    const featuredBrandNames = ['Blankin', 'Argue Culture', 'Armour Design', 'AVAVAVA'];
    const selectedBrands = allBrands.filter((b: Brand) => 
      featuredBrandNames.includes(b.brandName)
    );

    return {
      props: { selectedBrands },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Error loading brands:', error);
    return {
      props: { selectedBrands: [] },
      revalidate: 3600,
    };
  }
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

export default function LandingPageTest3({
  selectedBrands = [],
}: {
  selectedBrands: Brand[];
}) {
  const [brandProducts, setBrandProducts] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const products: Product[] = await response.json();

        const brandImageMap: { [key: string]: string } = {};

        selectedBrands.forEach((brand) => {
          const brandProduct = products.find((p) =>
            p.name.toLowerCase().includes(brand.brandName.toLowerCase())
          );
          if (brandProduct && brandProduct.image) {
            brandImageMap[brand.brandName.toLowerCase()] = brandProduct.image;
          }
        });

        setBrandProducts(brandImageMap);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    if (selectedBrands.length > 0) {
      fetchProducts();
    }
  }, [selectedBrands]);

  return (
    <>
      <Head>
        <title>RAPID. - Discover 100+ Verified Sellers</title>
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

      {/* HERO SECTION */}
      <section className="bg-white py-24 md:py-32 px-4 relative flex items-center justify-center min-h-[600px]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-2xl font-black mb-2 text-gray-700" style={{ fontFamily: 'Jaro' }}>
            47,000+ hauls. 100+ sellers.
          </p>
          <p className="text-2xl font-black mb-8 text-gray-700" style={{ fontFamily: 'Jaro' }}>
            4.8★ average seller rating.
          </p>

          <h1 className="text-5xl md:text-6xl font-black mb-8 uppercase leading-tight" style={{ fontFamily: 'Jaro' }}>
            Your Haul Could Be Next.
          </h1>

          <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto" style={{ fontFamily: 'Staatliches' }}>
            Buy from 100+ verified sellers with complete buyer protection.
          </p>

          <button
            onClick={() => window.location.href = '/fashion-listings'}
            className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-colors uppercase"
            style={{ fontFamily: 'Jaro' }}
          >
            Browse Top Sellers
          </button>
        </div>

        {/* WAVE DIVIDER */}
        <svg className="absolute bottom-0 left-0 w-full h-24 text-gray-100" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z" fill="currentColor"/>
        </svg>
      </section>

      {/* WHY RAPID - COLORFUL BOXES */}
      <section className="bg-gray-100 px-4 relative flex flex-col items-center justify-center min-h-[550px] pb-24">
        <div className="max-w-6xl mx-auto w-full">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 uppercase" style={{ fontFamily: 'Jaro' }}>
            Why RAPID?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-100 p-8 rounded-2xl text-center shadow-md hover:shadow-lg transition-shadow flex flex-col items-center justify-center min-h-[280px]">
              <div className="text-5xl font-black mb-4">✓</div>
              <h3 className="text-xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>
                Verified Sellers
              </h3>
              <p className="text-sm text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                ID verified and business licensed
              </p>
            </div>

            <div className="bg-green-100 p-8 rounded-2xl text-center shadow-md hover:shadow-lg transition-shadow flex flex-col items-center justify-center min-h-[280px]">
              <div className="text-5xl font-black mb-4">4.8★</div>
              <h3 className="text-xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>
                Avg Seller Rating
              </h3>
              <p className="text-sm text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Based on 1,000+ verified reviews
              </p>
            </div>

            <div className="bg-yellow-100 p-8 rounded-2xl text-center shadow-md hover:shadow-lg transition-shadow flex flex-col items-center justify-center min-h-[280px]">
              <div className="text-5xl font-black mb-4">24/7</div>
              <h3 className="text-xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>
                Support
              </h3>
              <p className="text-sm text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Questions? We're here to help
              </p>
            </div>

            <div className="bg-red-100 p-8 rounded-2xl text-center shadow-md hover:shadow-lg transition-shadow flex flex-col items-center justify-center min-h-[280px]">
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

        {/* WAVE DIVIDER */}
        <svg className="absolute bottom-0 left-0 w-full h-24 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,100 600,50 T1200,50 L1200,120 L0,120 Z" fill="currentColor"/>
        </svg>
      </section>

      {/* FEATURED BRANDS */}
      <section className="bg-white px-4 relative flex flex-col items-center justify-center min-h-[650px] pb-24">
        <div className="max-w-6xl mx-auto w-full">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-4 uppercase" style={{ fontFamily: 'Jaro' }}>
            Featured Brands
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            Browse new items indexed daily from 100+ verified sellers
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {selectedBrands.map((brand) => {
              const productImage = brandProducts[brand.brandName.toLowerCase()];

              return (
                <Link key={brand.slug} href={`/brands/${brand.slug}`}>
                  <div className="bg-white border-2 border-gray-300 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer h-full flex overflow-hidden">
                    {/* Image Section */}
                    {productImage && (
                      <div className="w-48 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <img
                          src={productImage}
                          alt={brand.brandName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Content Section */}
                    <div className="p-6 flex flex-col flex-grow justify-center">
                      <h3 className="text-2xl font-black mb-3 text-gray-900" style={{ fontFamily: 'Jaro' }}>
                        {brand.brandName}
                      </h3>
                      <p className="text-sm text-gray-700 mb-4 flex-grow">
                        {brand.description}
                      </p>
                      <button
                        className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors text-sm uppercase w-full"
                        style={{ fontFamily: 'Jaro' }}
                      >
                        View Brand →
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* WAVE DIVIDER */}
        <svg className="absolute bottom-0 left-0 w-full h-24 text-gray-100" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z" fill="currentColor"/>
        </svg>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-100 px-4 relative flex flex-col items-center justify-center min-h-[550px] pb-24">
        <div className="max-w-6xl mx-auto w-full">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 uppercase" style={{ fontFamily: 'Jaro' }}>
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center flex flex-col items-center justify-center">
              <div className="text-6xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>1</div>
              <h3 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>Find & Buy</h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Browse 100+ sellers. See ratings & reviews.
              </p>
            </div>

            <div className="text-center flex flex-col items-center justify-center">
              <div className="text-6xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>2</div>
              <h3 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>Seller Ships</h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Verify w/ QC photos. Escrow holds payment.
              </p>
            </div>

            <div className="text-center flex flex-col items-center justify-center">
              <div className="text-6xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>3</div>
              <h3 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>Dispute Protected</h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                99.2% of disputes resolved within 7 days.
              </p>
            </div>
          </div>
        </div>

        {/* WAVE DIVIDER */}
        <svg className="absolute bottom-0 left-0 w-full h-24 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,100 600,50 T1200,50 L1200,120 L0,120 Z" fill="currentColor"/>
        </svg>
      </section>

      {/* NO RISK. ALL UPSIDE */}
      <section className="bg-white py-24 md:py-32 px-4 relative flex items-center justify-center min-h-[700px] pt-40">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-12 uppercase" style={{ fontFamily: 'Jaro' }}>
            No Risk. All Upside.
          </h2>

          <div className="space-y-4 mb-12">
            <div className="bg-blue-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-black mb-2 uppercase" style={{ fontFamily: 'Jaro' }}>
                📸 QC Protection
              </h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Sellers must provide QC photos before shipping. You decide.
              </p>
            </div>

            <div className="bg-green-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-black mb-2 uppercase" style={{ fontFamily: 'Jaro' }}>
                💬 24/7 Support
              </h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Questions? Our team responds within hours.
              </p>
            </div>

            <div className="bg-orange-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-black mb-2 uppercase" style={{ fontFamily: 'Jaro' }}>
                ⚖️ Dispute Guarantee
              </h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                99.2% of disputes resolved within 7 days. Full refund if not.
              </p>
            </div>
          </div>

          <div className="bg-gray-100 p-8 rounded-2xl shadow-lg text-center">
            <p className="text-2xl font-black mb-4 uppercase" style={{ fontFamily: 'Jaro' }}>
              Ready? Your first haul is 2 minutes away.
            </p>
            <button
              onClick={() => handleSignupClick('https://www.sugargoo.com/register?memberId=3229302312621422771')}
              className="bg-black text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-colors uppercase"
              style={{ fontFamily: 'Jaro' }}
            >
              Start Shopping Now
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
