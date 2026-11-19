import Link from 'next/link';
import ProductImage from './ProductImage';
import WishlistButton from './WishlistButton';
import VerifiedTick from './VerifiedTick';
import { useHandoff } from '@/contexts/HandoffContext';
import { gillyNoteFor } from '@/lib/gillyPicks';

export interface ProductCardData {
  id: string;
  name: string;
  image: string;
  price: string;
  sugargooLink: string;
  category: string;
  gillyNote?: string;
  brand?: string;
  brandSlug?: string;
  itemName?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  /** Category namespace for the wishlist store — 'fashion' | 'tech'. */
  wishlistCategory: string;
  /** Small tags shown under the name — e.g. a matched style/fit, or quiz-match reasons. */
  tags?: string[];
  /** Extra work on the actual exit to Sugargoo (after the handoff sheet). */
  onBuyClick?: () => void;
  /** Image crop — fashion photography reads better at 4:5, tech product shots are square. */
  aspect?: '4:5' | 'square';
  /** Gilly's handwritten note (Gilly picks only). Off on the homepage. */
  showGillyNote?: boolean;
}

/**
 * Shared listing card (Direction A, "Verified"): a clean photo on a neutral
 * tile, then the brand line (brand name + green verified tick, linking to the
 * brand page), the item name in sentence case, and a red buy pill that opens
 * the Sugargoo handoff sheet. Gilly picks can carry Gilly's note in blue pen.
 */
export default function ProductCard({
  product,
  wishlistCategory,
  tags = [],
  onBuyClick,
  aspect = '4:5',
  showGillyNote = true,
}: ProductCardProps) {
  const { handleBuyClick } = useHandoff();
  const note = showGillyNote ? gillyNoteFor(product) : null;
  const productHref = `/product/${product.id}?category=${wishlistCategory}`;

  return (
    <div className="flex flex-col relative min-w-0">
      <WishlistButton
        productId={product.id}
        category={wishlistCategory}
        className="absolute top-2 right-2 z-10 !w-11 !h-11"
      />
      <Link href={productHref} className="block mb-3" tabIndex={-1} aria-hidden="true">
        <div
          className={`${aspect === 'square' ? 'aspect-square' : 'aspect-[4/5]'} relative bg-paper rounded-md overflow-hidden`}
        >
          <ProductImage src={product.image} alt="" />
        </div>
      </Link>

      {product.brand && (
        <span className="flex items-center gap-1.5 mb-0.5 min-w-0">
          {product.brandSlug ? (
            <Link
              href={`/brands/${product.brandSlug}`}
              className="text-[11.5px] uppercase tracking-[0.06em] text-ink truncate underline decoration-line underline-offset-[3px] hover:decoration-ink"
            >
              {product.brand}
            </Link>
          ) : (
            <span className="text-[11.5px] uppercase tracking-[0.06em] text-ink truncate">{product.brand}</span>
          )}
          <VerifiedTick />
        </span>
      )}

      <Link href={productHref} className="group">
        <h3 className="font-body font-semibold text-sm leading-snug line-clamp-2 group-hover:underline underline-offset-2">
          {product.itemName || product.name}
        </h3>
      </Link>

      {note && (
        <p className="gilly-note mt-2">
          {note.text}
          {note.sample && (
            <span className="ml-1.5 align-middle font-mono text-[9px] uppercase tracking-wide text-muted border border-line rounded px-1 py-px">
              sample
            </span>
          )}
        </p>
      )}

      {tags.length > 0 && (
        <span className="mt-2 text-[11px] text-muted truncate" title={tags.join(' · ')}>
          {tags.join(' · ')}
        </span>
      )}

      <div className="mt-auto pt-3 flex items-center justify-between gap-2">
        <span className="font-mono text-sm">{product.price}</span>
        <a
          href={product.sugargooLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleBuyClick(e, product, { onExit: () => onBuyClick?.() })}
          className="btn-stamp !px-4 !py-2 !text-[13px]"
        >
          Buy
        </a>
      </div>
    </div>
  );
}
