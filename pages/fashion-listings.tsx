import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import LoadingMessage, { CATEGORY_MESSAGES } from '@/components/LoadingMessage';
import WishlistButton from '@/components/WishlistButton';
import { productMatchesBrand } from '@/lib/brandMatch';

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

interface Brand {
  brandName: string;
  slug: string;
  description: string;
  aesthetic: string[];
  targetCustomer: string;
  notes: string;
}

const FASHION_CATEGORIES = [
  'All',
  'T-Shirts',
  'Hoodies',
  'Pants',
  'Jackets',
  'Accessories',
  'Bags',
  'Outerwear',
  'Other',
];

const ITEM_TYPE_SORTS = [
  'Newest',
  'Price: Low to High',
  'Price: High to Low',
  'Name: A to Z',
  'Name: Z to A',
];

export default function FashionListings() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (router.isReady && router.query.category) {
      const categoryParam = router.query.category as string;
      const categoryMap: { [key: string]: string } = {
        all: 'All',
        't-shirts': 'T-Shirts',
        hoodies: 'Hoodies',
        pants: 'Pants',
        jackets: 'Jackets',
        accessories: 'Accessories',
        bags: 'Bags',
        outerwear: 'Outerwear',
      };
      setSelectedCategory(categoryMap[categoryParam.toLowerCase()] || 'All');
    }
  }, [router.isReady, router.query.category]);

  useEffect(() => {
    fetch('/data/brands.json').then((r) => r.json()).then(setBrands).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/api/products?category=fashion')
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
    if (selectedBrand !== 'All') {
      filtered = filtered.filter((p) => productMatchesBrand(p.name, selectedBrand));
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }

    switch (selectedSort) {
      case 'Price: Low to High':
        filtered.sort((a, b) => parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', '')));
        break;
      case 'Price: High to Low':
        filtered.sort((a, b) => parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', '')));
        break;
      case 'Name: A to Z':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'Name: Z to A':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, selectedBrand, selectedSort, searchTerm]);

  return (
    <>
      <Head>
        <title>Fashion — RAPID Marketplace</title>
        <meta name="description" content="Browse fashion products from verified sellers via Sugargoo" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <div className="flex items-baseline justify-between mb-2">
          <span className="eyebrow">Index — Fashion</span>
          <span className="eyebrow hidden sm:inline">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
        <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-14">
          Fashion
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
                {FASHION_CATEGORIES.map((category) => (
                  <li key={category}>
                    <button
                      onClick={() => setSelectedCategory(category)}
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
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-paper border border-line text-sm"
              >
                {FASHION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="mb-8 hidden lg:block">
              <h3 className="eyebrow mb-3">Brand</h3>
              <ul className="max-h-64 overflow-y-auto pr-2">
                <li>
                  <button
                    onClick={() => setSelectedBrand('All')}
                    className={`block w-full text-left py-1.5 text-sm transition-colors ${
                      selectedBrand === 'All' ? 'text-stamp font-semibold' : 'text-ink/70 hover:text-ink'
                    }`}
                  >
                    All Brands
                  </button>
                </li>
                {brands.map((brand) => (
                  <li key={brand.slug}>
                    <button
                      onClick={() => setSelectedBrand(brand.brandName)}
                      className={`block w-full text-left py-1.5 text-sm transition-colors ${
                        selectedBrand === brand.brandName ? 'text-stamp font-semibold' : 'text-ink/70 hover:text-ink'
                      }`}
                    >
                      {brand.brandName}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8 lg:hidden">
              <label htmlFor="brand" className="eyebrow block mb-2">Brand</label>
              <select
                id="brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-paper border border-line text-sm"
              >
                <option value="All">All Brands</option>
                {brands.map((b) => <option key={b.slug} value={b.brandName}>{b.brandName}</option>)}
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
              <>
                <LoadingMessage messages={CATEGORY_MESSAGES.fashion} className="mb-6" />
                <ProductGridSkeleton aspect="4:5" />
              </>
            ) : filteredProducts.length === 0 ? (
              <p className="font-mono text-sm text-muted py-12">
                No products found. Try a different search or category.
              </p>
            ) : (
              <Reveal stagger={60} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex flex-col relative">
                    <WishlistButton productId={product.id} category="fashion" className="absolute top-2 right-2 z-10" />
                    <Link href={`/product/${product.id}?category=fashion`} className="group">
                      <div className="aspect-[4/5] bg-paper border border-line overflow-hidden mb-3">
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
