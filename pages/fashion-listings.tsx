import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import LoadingMessage, { CATEGORY_MESSAGES } from '@/components/LoadingMessage';
import ProductCard from '@/components/ProductCard';
import ProductFilterBar from '@/components/ProductFilterBar';
import { productMatchesBrand } from '@/lib/brandMatch';
import { STYLE_OPTIONS, FIT_OPTIONS, type StyleKey, type FitKey } from '@/lib/styleMatch';

interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  sugargooLink: string;
  category: string;
  verified?: boolean;
  manualStyleTags?: StyleKey[];
  manualFit?: FitKey | null;
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

const STYLE_LABELS = Object.fromEntries(STYLE_OPTIONS.map((o) => [o.key, o.label]));
const FIT_LABELS = Object.fromEntries(FIT_OPTIONS.map((o) => [o.key, o.label]));

// Baymard's product-list-loading guidance skews lower on mobile (15–30 items)
// than on a desktop apparel grid (100–150) — smaller viewport, heavier
// per-scroll cost. These are scaled down from that range for RAPID's larger card.
const PAGE_SIZE_DESKTOP = 60;
const PAGE_SIZE_MOBILE = 24;

function getPageSize() {
  if (typeof window === 'undefined') return PAGE_SIZE_DESKTOP;
  return window.innerWidth < 1024 ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;
}

export default function FashionListings() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStyle, setSelectedStyle] = useState<StyleKey | 'All'>('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE_DESKTOP);

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
    if (selectedStyle !== 'All') {
      filtered = filtered.filter((p) => p.manualStyleTags?.includes(selectedStyle));
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
    // A new filter/sort/search result set starts back at page one.
    setVisibleCount(getPageSize());
  }, [products, selectedCategory, selectedStyle, selectedBrand, selectedSort, searchTerm]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <>
      <Head>
        <title>Fashion — RAPID Marketplace</title>
        <meta name="description" content="Browse fashion products from verified sellers via Sugargoo" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <span className="eyebrow block mb-2">Index — Fashion</span>
        <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85] mb-10">
          Fashion
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
              onSelect: setSelectedCategory,
              options: FASHION_CATEGORIES.slice(1).map((c) => ({ key: c, label: c })),
            },
            {
              key: 'style',
              title: 'Style',
              allLabel: 'All',
              selected: selectedStyle,
              onSelect: (v) => setSelectedStyle(v as StyleKey | 'All'),
              options: STYLE_OPTIONS.map((s) => ({ key: s.key, label: s.label })),
            },
            {
              key: 'brand',
              title: 'Brand',
              allLabel: 'All Brands',
              selected: selectedBrand,
              onSelect: setSelectedBrand,
              options: brands.map((b) => ({ key: b.slug, value: b.brandName, label: b.brandName })),
              scroll: true,
            },
          ]}
          sorts={ITEM_TYPE_SORTS}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          resultCount={filteredProducts.length}
        />

        {loading ? (
          <>
            <LoadingMessage messages={CATEGORY_MESSAGES.fashion} className="mb-6" />
            <ProductGridSkeleton aspect="4:5" cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
          </>
        ) : filteredProducts.length === 0 ? (
          <p className="font-mono text-sm text-muted py-12">
            No products found. Try a different search or category.
          </p>
        ) : (
          <>
            <Reveal stagger={60} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
              {visibleProducts.map((product) => {
                const tags = [
                  ...(product.manualStyleTags?.map((s) => STYLE_LABELS[s]) ?? []),
                  product.manualFit ? FIT_LABELS[product.manualFit] : null,
                ].filter(Boolean) as string[];

                return (
                  <ProductCard key={product.id} product={product} wishlistCategory="fashion" tags={tags} />
                );
              })}
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
