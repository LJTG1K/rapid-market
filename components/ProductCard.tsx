import Link from 'next/link';
import ProductImage from './ProductImage';
import WishlistButton from './WishlistButton';
import { generateEventId } from '@/lib/metaPixel';
import { fireBuyClickPixelEvents } from '@/lib/redditPixel';

export interface ProductCardData {
  id: string;
  name: string;
  image: string;
  price: string;
  sugargooLink: string;
  category: string;
}

interface ProductCardProps {
  product: ProductCardData;
  /** Category namespace for the wishlist store — 'fashion' | 'tech'. */
  wishlistCategory: string;
  /** Small accent tags shown next to the price — e.g. a matched style/fit, or quiz-match reasons. */
  tags?: string[];
  onBuyClick?: () => void;
  /** Image crop — fashion photography reads better at 4:5, tech product shots are square. */
  aspect?: '4:5' | 'square';
}

/**
 * Shared listing card — used by fashion-listings.tsx and ProductMatchGrid so
 * the card only needs updating in one place. Borderless image, a 3-line
 * caption (category, name, price row), and a quiet text CTA rather than a
 * solid button per card — see the fashion-listings reskin brief.
 */
export default function ProductCard({ product, wishlistCategory, tags = [], onBuyClick, aspect = '4:5' }: ProductCardProps) {
  return (
    <div className="flex flex-col relative">
      <WishlistButton
        productId={product.id}
        category={wishlistCategory}
        className="absolute top-2 right-2 z-10 !w-11 !h-11"
      />
      <Link href={`/product/${product.id}?category=${wishlistCategory}`} className="group">
        <div className={`${aspect === 'square' ? 'aspect-square' : 'aspect-[4/5]'} bg-paper overflow-hidden mb-3`}>
          <ProductImage src={product.image} alt={product.name} />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted mb-1 block">
          {product.category}
        </span>
        <h3 className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-stamp transition-colors">
          {product.name}
        </h3>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-sm">{product.price}</span>
        {tags.length > 0 && (
          <span className="tag !text-[9.5px] !px-2 !py-0.5 truncate max-w-[60%]" title={tags.join(' · ')}>
            {tags.join(' · ')}
          </span>
        )}
      </div>
      <a
        href={product.sugargooLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          // Fires for every ProductCard exit to Sugargoo regardless of
          // whether the parent also wires its own onBuyClick (e.g. the
          // style-quiz-pick-click log in ProductMatchGrid) — so no consumer
          // of this shared card can silently ship without Reddit tracking.
          fireBuyClickPixelEvents(generateEventId(), {
            products: [{ id: product.id, name: product.name }],
          });
          onBuyClick?.();
        }}
        className="self-start font-mono text-[11px] uppercase tracking-wide text-muted hover:text-stamp focus-visible:text-stamp transition-colors"
      >
        View →
      </a>
    </div>
  );
}
