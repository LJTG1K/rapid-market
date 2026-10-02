import { useEffect, useMemo, useState } from 'react';
import { productMatchesBrand } from '@site/brandMatch';
import { workingBrands } from '../lib/brands';
import { api } from '../lib/client';
import type { ProductSummary } from '../lib/products';
import type { Brand, BrandDraft } from '../lib/types';
import { useStudio } from './StudioContext';

/**
 * Published brands + the shared draft queue + live product names. Match
 * counts use the site's own lib/brandMatch.ts so Studio's numbers are exactly
 * what the brand pages will show.
 */
export function useBrands() {
  const { drafts: allDrafts, contentVersion } = useStudio();
  const drafts = useMemo(() => allDrafts.filter((d): d is BrandDraft => d.targetType === 'brand'), [allDrafts]);
  const [published, setPublished] = useState<Brand[] | null>(null);
  const [products, setProducts] = useState<{ names: string[]; available: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ brands: Brand[] }>('/api/brands')
      .then((r) => setPublished(r.brands))
      .catch((e) => setError(e.message));
    api<{ products: ProductSummary[]; available: boolean }>('/api/products')
      .then((r) => setProducts({ names: r.products.map((p) => p.name), available: r.available }))
      .catch(() => setProducts({ names: [], available: false }));
  }, [contentVersion]);

  const brands = useMemo(() => (published ? workingBrands(published, drafts) : null), [published, drafts]);

  // Vocabulary counts come from *published* brands, so a tag that only exists
  // in a draft still reads as "new" until it ships.
  const vocabulary = useMemo(() => {
    const m = new Map<string, number>();
    published?.forEach((b) => b.aesthetic.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return m;
  }, [published]);

  const matchesFor = useMemo(() => {
    const cache = new Map<string, string[]>();
    return (name: string): string[] => {
      const key = name.trim();
      if (!key || !products?.available) return [];
      if (!cache.has(key)) cache.set(key, products.names.filter((p) => productMatchesBrand(p, key)));
      return cache.get(key)!;
    };
  }, [products]);

  return { published, brands, drafts, vocabulary, matchesFor, productsReady: products !== null, productsAvailable: !!products?.available, error };
}
