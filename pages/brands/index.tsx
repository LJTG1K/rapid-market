import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { productMatchesBrand } from '@/lib/brandMatch';

interface Brand {
  brandName: string;
  slug: string;
  description: string;
  aesthetic: string[];
  targetCustomer: string;
  notes: string;
}

export async function getStaticProps() {
  try {
    const brandsData = await import('../../public/data/brands.json');
    const brands = [...brandsData.default].sort((a, b) =>
      a.brandName.localeCompare(b.brandName, 'en', { sensitivity: 'base' })
    );
    return { props: { brands }, revalidate: 3600 };
  } catch (error) {
    console.error('Error fetching brands:', error);
    return { props: { brands: [] }, revalidate: 60 };
  }
}

interface Product {
  id: string;
  name: string;
  image: string;
  brand: string;
}

export default function BrandsDirectory({ brands }: { brands: Brand[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>(brands);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      setFilteredBrands(
        brands.filter((b) => b.brandName.toLowerCase().includes(s) || b.description.toLowerCase().includes(s))
      );
    } else {
      setFilteredBrands(brands);
    }
  }, [searchTerm, brands]);

  const getFeaturedProduct = (brandName: string) =>
    products.find((p) => productMatchesBrand(p.name, brandName));

  return (
    <>
      <Head>
        <title>Seller Index — RAPID Marketplace</title>
        <meta name="description" content="Browse all 100+ featured sellers on RAPID" />
        <link rel="canonical" href="https://rapid.market/brands" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'CollectionPage',
              name: 'RAPID Seller Index',
              description: 'Explore 100+ featured sellers with exclusive products',
              url: 'https://rapid.market/brands',
              mainEntity: {
                '@type': 'ItemList',
                numberOfItems: brands.length,
                itemListElement: brands.slice(0, 50).map((brand, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  url: `https://rapid.market/brands/${brand.slug}`,
                  name: brand.brandName,
                  description: brand.description,
                })),
              },
            }),
          }}
        />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <div className="flex items-baseline justify-between mb-2">
          <span className="eyebrow">Index — Sellers</span>
          <span className="eyebrow hidden sm:inline">{filteredBrands.length} of {brands.length}</span>
        </div>
        <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-10">
          Seller Index
        </h1>

        <div className="mb-14 max-w-lg">
          <label htmlFor="brand-search" className="eyebrow block mb-2">Search by name or aesthetic</label>
          <input
            id="brand-search"
            type="text"
            placeholder="e.g. techwear, minimalist, Argue Culture…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
          />
        </div>

        {filteredBrands.length === 0 ? (
          <p className="font-mono text-sm text-muted py-12">No sellers found. Try a different search.</p>
        ) : (
          <Reveal className="grid grid-cols-1 md:grid-cols-2 border-t border-line">
            {filteredBrands.map((brand, i) => {
              const featured = getFeaturedProduct(brand.brandName);
              return (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className="group flex gap-4 items-start py-6 px-0 md:px-6 border-b border-line md:odd:border-r md:even:pl-6"
                >
                  <span className="font-mono text-xs text-muted pt-1 w-10 shrink-0">
                    {String(i + 1).padStart(3, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-black text-2xl group-hover:text-stamp transition-colors mb-1.5 truncate">
                      {brand.brandName}
                    </h2>
                    <p className="text-sm text-ink/70 leading-snug mb-3 line-clamp-2">{brand.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {brand.aesthetic.slice(0, 2).map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                      {brand.aesthetic.length > 2 && (
                        <span className="font-mono text-xs text-muted">+{brand.aesthetic.length - 2}</span>
                      )}
                    </div>
                  </div>
                  {featured && (
                    <div className="hidden sm:block w-20 h-24 bg-paper border border-line shrink-0 overflow-hidden">
                      <img src={featured.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </Link>
              );
            })}
          </Reveal>
        )}
      </div>
    </>
  );
}
