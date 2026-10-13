import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import LoadingMessage, { CATEGORY_MESSAGES } from '@/components/LoadingMessage';
import ProductCard from '@/components/ProductCard';
import ProductFilterBar from '@/components/ProductFilterBar';

interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  sugargooLink: string;
  category: string;
  verified?: boolean;
}

const PHONE_CASES_CATEGORY = 'Phone Cases';

const SORTS = [
  'Newest',
  'Price: Low to High',
  'Price: High to Low',
  'Name: A to Z',
  'Name: Z to A',
];

export default function PhoneCases() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState('Newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/products?category=tech')
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(data.filter((p) => p.category === PHONE_CASES_CATEGORY)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visibleProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }

    const price = (p: Product) => parseFloat(p.price.replace(/[$,]/g, ''));
    switch (selectedSort) {
      case 'Price: Low to High':
        filtered.sort((a, b) => price(a) - price(b));
        break;
      case 'Price: High to Low':
        filtered.sort((a, b) => price(b) - price(a));
        break;
      case 'Name: A to Z':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'Name: Z to A':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return filtered;
  }, [products, searchTerm, selectedSort]);

  return (
    <>
      <Head>
        <title>Phone Cases — RAPID Marketplace</title>
        <meta
          name="description"
          content="Phone cases from independent makers — INFN, YEJUN, Shell Research, PB Case and more, shipped via Sugargoo"
        />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <Link href="/tech-listings" className="link-underline font-mono text-xs uppercase tracking-wide">
          ← Tech index
        </Link>

        <div className="mt-8 mb-10">
          <span className="eyebrow block mb-2">Index — Tech</span>
          <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-4">
            Phone Cases
          </h1>
          <p className="text-ink/70 leading-relaxed max-w-lg">
            Shells from independent case makers. Check your device model in each listing before ordering.
          </p>
        </div>

        <ProductFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          groups={[]}
          sorts={SORTS}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          resultCount={visibleProducts.length}
        />

        {loading ? (
          <>
            <LoadingMessage messages={CATEGORY_MESSAGES.tech} className="mb-6" />
            <ProductGridSkeleton cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
          </>
        ) : visibleProducts.length === 0 ? (
          <p className="font-mono text-sm text-muted py-12">
            {products.length === 0 ? 'No phone cases listed right now.' : 'No phone cases match that search.'}
          </p>
        ) : (
          <Reveal stagger={60} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} wishlistCategory="tech" aspect="square" />
            ))}
          </Reveal>
        )}

        <div className="mt-16 pt-8 border-t border-line text-center">
          <Link href="/tech-listings" className="link-underline font-mono text-xs uppercase tracking-wide">
            Browse all tech →
          </Link>
        </div>
      </div>
    </>
  );
}
