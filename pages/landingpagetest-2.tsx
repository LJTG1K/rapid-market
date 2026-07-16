import Link from 'next/link';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import { useState, useEffect } from 'react';

interface Brand {
  brandName: string;
  slug: string;
  description: string;
  aesthetic: string[];
}

interface Product {
  id: string;
  name: string;
  image: string;
}

export async function getStaticProps() {
  try {
    const brandsPath = path.join(process.cwd(), 'public', 'data', 'brands.json');
    const brandsData = fs.readFileSync(brandsPath, 'utf-8');
    const allBrands = JSON.parse(brandsData);

    // Select top 3 brands
    const topBrands = allBrands.slice(0, 3);

    return {
      props: { topBrands },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Error loading brands:', error);
    return {
      props: { topBrands: [] },
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

export default function LandingPageTest2({ topBrands = [] }: { topBrands: Brand[] }) {
  const [brandProducts, setBrandProducts] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const products: Product[] = await response.json();
        
        const brandImageMap: { [key: string]: string } = {};
        
        topBrands.forEach((brand) => {
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

    if (topBrands.length > 0) {
      fetchProducts();
    }
  }, [topBrands]);
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

      {/* HERO SECTION - White */}
      <section className="bg-white px-4 relative flex flex-col items-center justify-center min-h-[480px]">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6 uppercase leading-tight" style={{ fontFamily: 'Jaro' }}>
            The Community Marketplace
          </h1>

          <div className="space-y-3 mb-12">
            <p className="text-2xl font-black" style={{ fontFamily: 'Jaro' }}>
              100+ sellers all verified.
            </p>
            <p className="text-2xl font-black" style={{ fontFamily: 'Jaro' }}>
              New items indexed daily.
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/fashion-listings'}
            className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-colors uppercase"
            style={{ fontFamily: 'Jaro' }}
          >
            Start Browsing
          </button>
        </div>
      </section>

      {/* COMMUNITY MILESTONES - Full-width Blue */}
      <section className="bg-blue-600 text-white px-4 relative flex flex-col items-center justify-center min-h-[480px]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 uppercase" style={{ fontFamily: 'Jaro' }}>
            RAPID Milestones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-20 backdrop-blur p-8 rounded-2xl text-center">
              <div className="text-4xl font-black mb-2 text-white" style={{ fontFamily: 'Jaro' }}>15,234</div>
              <div className="text-sm font-bold uppercase text-white mb-2">Members</div>
              <p className="text-sm text-blue-100" style={{ fontFamily: 'Staatliches' }}>Active this month</p>
            </div>

            <div className="bg-white bg-opacity-20 backdrop-blur p-8 rounded-2xl text-center">
              <div className="text-sm font-bold uppercase text-white mb-2" style={{ fontFamily: 'Jaro' }}>New items indexed daily</div>
              <p className="text-sm text-blue-100" style={{ fontFamily: 'Staatliches' }}>Verified authentic</p>
            </div>

            <div className="bg-white bg-opacity-20 backdrop-blur p-8 rounded-2xl text-center">
              <div className="text-4xl font-black mb-2 text-white" style={{ fontFamily: 'Jaro' }}>100+</div>
              <div className="text-sm font-bold uppercase text-white mb-2">Sellers</div>
              <p className="text-sm text-blue-100" style={{ fontFamily: 'Staatliches' }}>All verified</p>
            </div>

            <div className="bg-white bg-opacity-20 backdrop-blur p-8 rounded-2xl text-center">
              <div className="text-4xl font-black mb-2 text-white" style={{ fontFamily: 'Jaro' }}>99.2%</div>
              <div className="text-sm font-bold uppercase text-white mb-2">Disputes Resolved</div>
              <p className="text-sm text-blue-100" style={{ fontFamily: 'Staatliches' }}>Within 7 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED SELLERS - Light Gray */}
      <section className="bg-gray-100 px-4 relative flex flex-col items-center justify-center min-h-[520px]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 uppercase" style={{ fontFamily: 'Jaro' }}>
            Top Sellers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {topBrands.map((brand, idx) => {
              const productImage = brandProducts[brand.brandName.toLowerCase()];
              return (
                <Link key={brand.slug} href={`/brands/${brand.slug}`}>
                  <div className="bg-white border-2 border-gray-300 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer h-full flex overflow-hidden flex-col">
                    {/* Image Section */}
                    {productImage && (
                      <div className="w-full bg-gray-100 flex items-center justify-center flex-shrink-0" style={{ height: '200px' }}>
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
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="text-3xl font-black mb-3" style={{ fontFamily: 'Jaro' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                      <h3 className="text-2xl font-black mb-3" style={{ fontFamily: 'Jaro' }}>{brand.brandName}</h3>
                      <p className="text-sm text-gray-700 mb-6 flex-grow" style={{ fontFamily: 'Staatliches' }}>{brand.description}</p>
                      <button
                        className="w-full bg-black text-white px-4 py-2 rounded-full font-bold hover:bg-gray-800 transition-colors uppercase text-sm"
                        style={{ fontFamily: 'Jaro' }}
                      >
                        Browse Store
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - White */}
      <section className="bg-white px-4 relative flex flex-col items-center justify-center min-h-[480px]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 uppercase" style={{ fontFamily: 'Jaro' }}>
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-6xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>1</div>
              <h3 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>Browse</h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Explore 100+ verified sellers with new items indexed daily.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>2</div>
              <h3 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>Sign Up</h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Create a free account with Sugargoo in 60 seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl font-black mb-4" style={{ fontFamily: 'Jaro' }}>3</div>
              <h3 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: 'Jaro' }}>Order & Ship</h3>
              <p className="text-gray-700" style={{ fontFamily: 'Staatliches' }}>
                Order from sellers and ship worldwide. That's it!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION - Full-width Blue */}
      <section className="bg-blue-600 text-white px-4 relative flex flex-col items-center justify-center min-h-[480px]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase" style={{ fontFamily: 'Jaro' }}>
            Join the Community
          </h2>

          <p className="text-lg mb-8 opacity-95" style={{ fontFamily: 'Staatliches' }}>
            100+ verified sellers. New items indexed daily. All in one place.
          </p>

          <button
            onClick={() => handleSignupClick('https://www.sugargoo.com/register?memberId=3229302312621422771')}
            className="bg-white text-blue-600 px-12 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform uppercase"
            style={{ fontFamily: 'Jaro' }}
          >
            Start Browsing
          </button>
        </div>
      </section>
    </>
  );
}
