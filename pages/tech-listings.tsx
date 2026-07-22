import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';

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

export default function TechListings() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Newest');
  const [searchTerm, setSearchTerm] = useState('');

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
  }, [products, selectedCategory, selectedSort, searchTerm]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    const slug = category === 'All' ? 'all' : category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    router.push(`/tech-listings?category=${slug}`, undefined, { shallow: true });
  };

  return (
    <>
      <Head>
        <title>Tech — RAPID Marketplace</title>
        <meta name="description" content="Browse premium tech products — Gaming, Audio, Lighting, Phone Accessories and more via Sugargoo" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <div className="flex items-baseline justify-between mb-2">
          <span className="eyebrow">Index — Tech</span>
          <span className="eyebrow hidden sm:inline">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
        <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-14">
          Tech
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="mb-8">
              <label htmlFor="search" className="eyebrow block mb-2">Search</label>
              <input
                id="search"
                type="text"
                placeholder="Search products…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2.5 bg-paper border border-line focus:outline-none focus:border-ink text-sm"
              />
            </div>

            <div className="mb-8 hidden lg:block">
              <h3 className="eyebrow mb-3">Category</h3>
              <ul>
                {TECH_CATEGORIES.map((category) => (
                  <li key={category}>
                    <button
                      onClick={() => handleCategoryClick(category)}
                      className={`block w-full text-left py-1.5 text-sm transition-colors ${
                        selectedCategory === category ? 'text-stamp font-semibold' : 'text-ink/70 hover:text-ink'
                      }`}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8 lg:hidden">
              <label htmlFor="category" className="eyebrow block mb-2">Category</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => handleCategoryClick(e.target.value)}
                className="w-full px-3 py-2.5 bg-paper border border-line text-sm"
              >
                {TECH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="eyebrow block mb-2">Sort by</label>
              <select
                id="sort"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full px-3 py-2.5 bg-paper border border-line text-sm"
              >
                {ITEM_TYPE_SORTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <ProductGridSkeleton />
            ) : filteredProducts.length === 0 ? (
              <p className="font-mono text-sm text-muted py-12">
                No products found. Try a different search or category.
              </p>
            ) : (
              <Reveal stagger={60} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex flex-col">
                    <Link href={`/product/${product.id}?category=tech`} className="group">
                      <div className="aspect-square bg-paper border border-line overflow-hidden mb-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1 block">
                        {product.category}
                      </span>
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
                        className="btn-primary !px-4 !py-2 text-[11px]"
                      >
                        Buy
                      </a>
                    </div>
                  </div>
                ))}
              </Reveal>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-line text-center">
          <Link href="/brands" className="link-underline font-mono text-xs uppercase tracking-wide">
            Browse the full seller index →
          </Link>
        </div>
      </div>
    </>
  );
}
