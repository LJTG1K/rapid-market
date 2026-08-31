import Link from 'next/link';
import Reveal from './Reveal';
import ProductImage from './ProductImage';
import WishlistButton from './WishlistButton';
import { ProductGridSkeleton } from './ProductCardSkeleton';
import { STYLE_OPTIONS, type MatchedProduct } from '@/lib/styleMatch';

const STYLE_LABELS = Object.fromEntries(STYLE_OPTIONS.map((o) => [o.key, o.label]));

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
 * inline post-signup picks section — same card markup as fashion-listings.tsx
 * plus a small "Matches: X, Y" caption built from the score breakdown.
 */
export default function ProductMatchGrid({ products, loading = false }: ProductMatchGridProps) {
  if (loading) return <ProductGridSkeleton count={9} aspect="4:5" />;

  if (products.length === 0) {
    return <p className="text-sm text-ink/60">No picks yet — the index may be warming up, check back shortly.</p>;
  }

  return (
    <Reveal stagger={60} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
      {products.map((product) => {
        const reasons = [
          ...product.matchedStyles.map((s) => STYLE_LABELS[s]),
          product.budgetMatched ? 'Budget' : null,
          product.fitMatched ? 'Fit' : null,
        ].filter(Boolean) as string[];

        return (
          <div key={product.id} className="flex flex-col relative">
            <WishlistButton productId={product.id} category="fashion" className="absolute top-2 right-2 z-10" />
            <Link href={`/product/${product.id}?category=fashion`} className="group">
              <div className="aspect-[4/5] bg-paper border border-line overflow-hidden mb-3">
                <ProductImage src={product.image} alt={product.name} />
              </div>
              {reasons.length > 0 && (
                <span className="font-mono text-[11px] text-stamp mb-1 block uppercase tracking-wide">
                  Matches: {reasons.join(', ')}
                </span>
              )}
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
                onClick={() => trackPickClick(product.id)}
                className="btn-primary !px-4 !py-2 text-[11px]"
              >
                Buy
              </a>
            </div>
          </div>
        );
      })}
    </Reveal>
  );
}
