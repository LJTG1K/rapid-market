import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import LoadingMessage, { CATEGORY_MESSAGES } from '@/components/LoadingMessage';
import ProductCard from '@/components/ProductCard';
import ProductFilterBar from '@/components/ProductFilterBar';
import ProductMatchGrid from '@/components/ProductMatchGrid';
import CategoryShelf from '@/components/CategoryShelf';
import { productMatchesBrand } from '@/lib/brandMatch';
import { getAnswers, type StoredQuizAnswers } from '@/lib/styleQuizStorage';
import {
  matchProducts,
  STYLE_OPTIONS,
  type StyleKey,
  type FitKey,
  type Product,
  type Brand,
} from '@/lib/styleMatch';

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

// Short forms for the card tag — FIT_OPTIONS' own labels ("Regular / True to
// Size") are written for the quiz UI and are too long for a compact pill;
// they were truncating mid-word into a stray "/" or "…" on the card.
const FIT_TAG_LABELS: Record<FitKey, string> = {
  oversized: 'Oversized',
  regular: 'Regular',
  cropped: 'Cropped',
};

function getProductTags(product: Product): string[] {
  return [
    ...(product.manualStyleTags?.map((s) => STYLE_LABELS[s]) ?? []),
    product.manualFit ? FIT_TAG_LABELS[product.manualFit] : null,
  ].filter(Boolean) as string[];
}

// Baymard's product-list-loading guidance skews lower on mobile (15–30 items)
// than on a desktop apparel grid (100–150) — smaller viewport, heavier
// per-scroll cost. These are scaled down from that range for RAPID's larger card.
const PAGE_SIZE_DESKTOP = 60;
const PAGE_SIZE_MOBILE = 24;

function getPageSize() {
  if (typeof window === 'undefined') return PAGE_SIZE_DESKTOP;
  return window.innerWidth < 1024 ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const [quizAnswers, setQuizAnswers] = useState<StoredQuizAnswers | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuizAnswers(getAnswers());
  }, []);

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

  // The unfiltered, unsearched state — the master listing's front page, shown
  // as curated shelves instead of one flat grid. Any filter, style, brand, or
  // search term drops straight into the ordinary sortable grid below.
  const isBrowseMode =
    selectedCategory === 'All' &&
    selectedStyle === 'All' &&
    selectedBrand === 'All' &&
    searchTerm.trim() === '' &&
    selectedSort === 'Newest';

  const randomPicks = useMemo(() => shuffle(products).slice(0, 8), [products]);
  const quizPicks = useMemo(
    () => (quizAnswers ? matchProducts(products, brands, quizAnswers, 8) : []),
    [products, brands, quizAnswers]
  );
  const shelvesByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    FASHION_CATEGORIES.slice(1).forEach((cat) => {
      map[cat] = shuffle(products.filter((p) => p.category === cat)).slice(0, 4);
    });
    return map;
  }, [products]);

  const goToCategory = (category: string) => {
    setSelectedCategory(category);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <>
      <Head>
        <title>Fashion — RAPID Marketplace</title>
        <meta name="description" content="Browse fashion products from verified sellers via Sugargoo" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <span className="eyebrow block mb-2">Index — Fashion</span>
            <h1 className="font-display font-black text-ink text-6xl md:text-7xl tracking-tightest leading-[0.85]">
              Fashion
            </h1>
          </div>
          <Link href="/style-quiz" className="btn-secondary whitespace-nowrap">
            Take the Style Quiz →
          </Link>
        </div>

        <div ref={resultsRef}>
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
        </div>

        {loading ? (
          <>
            <LoadingMessage messages={CATEGORY_MESSAGES.fashion} className="mb-6" />
            <ProductGridSkeleton aspect="4:5" cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
          </>
        ) : products.length === 0 ? (
          <p className="font-mono text-sm text-muted py-12">
            No products found. Try a different search or category.
          </p>
        ) : isBrowseMode ? (
          <>
            <section className="mb-16">
              <div className="flex items-baseline justify-between mb-6 gap-4">
                <h2 className="font-display font-black text-ink text-2xl md:text-3xl tracking-tightest">
                  {quizAnswers ? 'Picked For You' : 'Popular Right Now'}
                </h2>
                {!quizAnswers && (
                  <Link href="/style-quiz" className="link-underline font-mono text-xs uppercase tracking-wide whitespace-nowrap">
                    Take the quiz for personalized picks →
                  </Link>
                )}
              </div>
              {quizAnswers ? (
                <ProductMatchGrid products={quizPicks} />
              ) : (
                <Reveal stagger={60} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
                  {randomPicks.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      wishlistCategory="fashion"
                      tags={getProductTags(product)}
                    />
                  ))}
                </Reveal>
              )}
            </section>

            {FASHION_CATEGORIES.slice(1)
              .filter((cat) => (shelvesByCategory[cat]?.length ?? 0) > 0)
              .map((cat) => (
                <CategoryShelf
                  key={cat}
                  title={cat}
                  wishlistCategory="fashion"
                  items={(shelvesByCategory[cat] ?? []).map((product) => ({
                    product,
                    tags: getProductTags(product),
                  }))}
                  onSeeAll={() => goToCategory(cat)}
                />
              ))}
          </>
        ) : filteredProducts.length === 0 ? (
          <p className="font-mono text-sm text-muted py-12">
            No products found. Try a different search or category.
          </p>
        ) : (
          <>
            <Reveal stagger={60} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wishlistCategory="fashion"
                  tags={getProductTags(product)}
                />
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
