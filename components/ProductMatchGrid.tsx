import Reveal from './Reveal';
import ProductCard from './ProductCard';
import { ProductGridSkeleton } from './ProductCardSkeleton';
import { STYLE_OPTIONS, type MatchedProduct } from '@/lib/styleMatch';

const STYLE_LABELS = Object.fromEntries(STYLE_OPTIONS.map((o) => [o.key, o.label]));

// Reddit's Lead event now fires from inside ProductCard itself on every
// Sugargoo-exit click, so this only needs to log the internal
// style-quiz-pick-click analytics event — see components/ProductCard.tsx.
function trackPickClick(productId: string) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'style-quiz-pick-click', productId }),
  }).catch(() => {});
}

interface ProductMatchGridProps {
  products: MatchedProduct[];
  loading?: boolean;
}

/**
 * Shared results grid, reused by pages/style-quiz.tsx (standalone) and the
 * inline post-signup picks section. Renders the same ProductCard as
 * fashion-listings.tsx, with the match reasons (style/budget/fit) surfaced as
 * the card's tag row instead of a separate "Matches:" caption line.
 */
export default function ProductMatchGrid({ products, loading = false }: ProductMatchGridProps) {
  if (loading) {
    return <ProductGridSkeleton count={9} aspect="4:5" cols="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />;
  }

  if (products.length === 0) {
    return <p className="text-sm text-ink/60">No picks yet — the index may be warming up, check back shortly.</p>;
  }

  return (
    <Reveal stagger={60} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
      {products.map((product) => {
        const tags = [
          ...product.matchedStyles.map((s) => STYLE_LABELS[s]),
          product.budgetMatched ? 'Budget' : null,
          product.fitMatched ? 'Fit' : null,
        ].filter(Boolean) as string[];

        return (
          <ProductCard
            key={product.id}
            product={product}
            wishlistCategory="fashion"
            tags={tags}
            onBuyClick={() => trackPickClick(product.id)}
          />
        );
      })}
    </Reveal>
  );
}
