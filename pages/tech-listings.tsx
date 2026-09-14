import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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

const TECH_CATEGORIES = [
  'All',
  'Gaming',
  'Phone Accessories',
  'Lighting',
  'Audio',
  'Desk Setup',
  'Skins & Wraps',
  'Decor & Keychains',
  'Other',
];

const ITEM_TYPE_SORTS = [
  'Newest',
  'Price: Low to High',
  'Price: High to Low',
  'Name: A to Z',
  'Name: Z to A',
];

// Baymard's product-list-loading guidance skews lower on mobile (15–30 items)
// than on a desktop grid (100–150) — smaller viewport, heavier per-scroll cost.
// These are scaled down from that range for RAPID's larger card.
const PAGE_SIZE_DESKTOP = 60;
const PAGE_SIZE_MOBILE = 24;

function getPageSize() {
  if (typeof window === 'undefined') return PAGE_SIZE_DESKTOP;
  return window.innerWidth < 1024 ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;
}

export default function TechListings() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE_DESKTOP);

  useEffect(() => {
    if (router.isReady && router.query.category) {
      const categoryParam = router.query.category as string;
      const categoryMap: { [key: string]: string } = {
        all: 'All',
        gaming: 'Gaming',
        'phone-accessories': 'Phone Accessories',
        lighting: 'Lighting',
        audio: 'Audio',
        'desk-setup': 'Desk Setup',
        'skins-wraps': 'Skins & Wraps',
        'decor-keychains': 'Decor & Keychains',
        other: 'Other',
      };
      setSelectedCategory(categoryMap[categoryParam.toLowerCase()] || 'All');
    }
  }, [router.isReady, router.query.category]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/products?category=tech')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setFilteredProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }

    filtered.sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[$,]/g, ''));
      const priceB = parseFloat(b.price.replace(/[$,]/g, ''));
      switch (selectedSort) {
        case 'Price: Low to High':
          return priceA - priceB;
        case 'Price: High to Low':
          return priceB - priceA;
        case 'Name: A to Z':
          return a.name.localeCompare(b.name);
        case 'Name: Z to A':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
    // A new filter/sort/search result set starts back at page one.
    setVisibleCount(getPageSize());
  }, [products, selectedCategory, selectedSort, searchTerm]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    const slug = category === 'All' ? 'all' : category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    router.push(`/tech-listings?category=${slug}`, undefined, { shallow: true });
  };

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <>
      <Head>
        <title>Tech — RAPID Marketplace</title>
        <meta name="description" content="Browse premium tech products — Gaming, Audio, Lighting, Phone Accessories and more via Sugargoo" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <span className="eyebrow block mb-2">Index — Tech</span>
        <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-10">
          Tech
        </h1>

        <ProductFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          groups={[
            {
              key: 'category',
              title: 'Category',
              allLabel: 'All',
              selected: selectedCategory,
              onSelect: handleCategoryClick,
              options: TECH_CATEGORIES.slice(1).map((c) => ({ key: c, label: c })),
            },
          ]}
          sorts={ITEM_TYPE_SORTS}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          resultCount={filteredProducts.length}
        />

        {loading ? (
          <>
            <LoadingMessage messages={CATEGORY_MESSAGES.tech} className="mb-6" />
            <ProductGridSkeleton cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
          </>
        ) : filteredProducts.length === 0 ? (
          <p className="font-mono text-sm text-muted py-12">
            No products found. Try a different search or category.
          </p>
        ) : (
          <>
            <Reveal stagger={60} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} wishlistCategory="tech" aspect="square" />
              ))}
            </Reveal>

            {visibleCount < filteredProducts.length && (
              <div className="mt-12 text-center">
                <button type="button" onClick={() => setVisibleCount((v) => v + getPageSize())} className="btn-secondary">
                  Load More — {visibleCount} of {filteredProducts.length}
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-16 pt-8 border-t border-line text-center">
          <Link href="/brands" className="link-underline font-mono text-xs uppercase tracking-wide">
            Browse the full seller index →
          </Link>
        </div>
      </div>
    </>
  );
}
