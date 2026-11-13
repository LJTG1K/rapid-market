import Link from 'next/link';
import ProductImage from './ProductImage';
import WishlistButton from './WishlistButton';
import VerifiedSeal from './VerifiedSeal';
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
 * Shared listing card (Direction A, "Verified"): the photo sits on a neutral
 * tile with a Verified-seller seal, then name, category and price, and a red
 * buy pill that opens the Sugargoo handoff sheet. Gilly picks can carry
 * Gilly's note in blue pen.
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

  return (
    <div className="flex flex-col relative min-w-0">
      <WishlistButton
        productId={product.id}
        category={wishlistCategory}
        className="absolute top-2 right-2 z-10 !w-11 !h-11"
      />
      <Link href={`/product/${product.id}?category=${wishlistCategory}`} className="group">
        <div
          className={`${aspect === 'square' ? 'aspect-square' : 'aspect-[4/5]'} relative bg-paper rounded-md overflow-hidden mb-3`}
        >
          <ProductImage src={product.image} alt={product.name} />
          <VerifiedSeal className="absolute left-2 top-2" />
        </div>
        <h3 className="font-body font-semibold text-sm leading-snug mb-0.5 line-clamp-2 group-hover:underline underline-offset-2">
          {product.name}
        </h3>
        <span className="text-xs text-muted block">{product.category}</span>
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
