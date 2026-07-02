import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Stamp from '@/components/Stamp';
import Reveal from '@/components/Reveal';

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

export async function getStaticPaths() {
  try {
    const brandsData = await import('../../public/data/brands.json');
    const brands = brandsData.default;
    return { paths: brands.map((b: Brand) => ({ params: { slug: b.slug } })), fallback: 'blocking' };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps(context: any) {
  try {
    const { slug } = context.params;
    const brandsData = await import('../../public/data/brands.json');
    const brand = brandsData.default.find((b: Brand) => b.slug === slug);
    if (!brand) return { notFound: true };
    return { props: { brand }, revalidate: 3600 };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
}

export default function BrandPage({ brand }: { brand: Brand }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (brand) {
      setFilteredProducts(products.filter((p) => p.name.toLowerCase().includes(brand.brandName.toLowerCase())));
    }
  }, [products, brand]);

  const trackClick = async (productId: string, productName: string) => {
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName, type: 'product-click', brand: brand.brandName }),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  if (!brand) return <div>Brand not found</div>;

  return (
    <>
      <Head>
        <title>{brand.brandName} — RAPID Marketplace</title>
        <meta name="description" content={brand.description} />
        <link rel="canonical" href={`https://rapid.market/brands/${brand.slug}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Brand',
              name: brand.brandName,
              description: brand.description,
              url: `https://rapid.market/brands/${brand.slug}`,
            }),
          }}
        />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <Link href="/brands" className="link-underline font-mono text-xs uppercase tracking-wide">
          ← All sellers
        </Link>

        <div className="mt-8 mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-6">
              {brand.brandName}
            </h1>
            <p className="text-xl text-ink/80 leading-relaxed max-w-2xl mb-6">{brand.description}</p>
            <div className="flex flex-wrap gap-2">
              {brand.aesthetic.map((tag) => <span key={tag} className="tag">{tag}</span>)}
            </div>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <Stamp size={104} centerText="QC" sub="Passed" ringText="Quality Checked · Verified Seller ·" />
          </div>
        </div>

        {brand.notes && (
          <div className="border-l-2 border-stamp pl-6 mb-16 max-w-2xl">
            <p className="eyebrow mb-2">About this seller</p>
            <p className="text-ink/80 leading-relaxed">{brand.notes}</p>
          </div>
        )}

        <div className="border-t border-line pt-12">
          <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest mb-10">
            Featured products
          </h2>

          {loading ? (
            <p className="font-mono text-sm text-muted py-12">Loading products…</p>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12">
              <p className="text-ink/70 mb-4">No products available from this seller yet.</p>
              <Link href="/fashion-listings" className="link-underline font-mono text-xs uppercase tracking-wide">
                Browse all products →
              </Link>
            </div>
          ) : (
            <>
              <Reveal className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex flex-col">
                    <Link href={`/product/${product.id}`} className="group">
                      <div className="aspect-square bg-paper border border-line overflow-hidden mb-3">
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain" loading="lazy" />
                      </div>
                      <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-stamp transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted mb-3 line-clamp-2">{product.description}</p>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <span className="font-mono text-sm">{product.price}</span>
                      <a
                        href={product.sugargooLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackClick(product.id, product.name)}
                        className="btn-primary !px-4 !py-2 text-[11px]"
                      >
                        Buy
                      </a>
                    </div>
                  </div>
                ))}
              </Reveal>
              <p className="font-mono text-xs text-muted mt-12 text-center uppercase tracking-wide">
                Showing {filteredProducts.length} products from {brand.brandName}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
