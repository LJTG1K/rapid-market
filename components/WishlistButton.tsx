import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface WishlistButtonProps {
  productId: string;
  category: string;
  className?: string;
  /** Render an inline labeled pill ("Save"/"Saved") instead of the icon-only overlay. */
  showLabel?: boolean;
}

/**
 * Heart toggle for saving a product. Reads WishlistContext. Logged-out clicks
 * route to /login (preserving where the user was). Default is an icon-only box
 * designed to sit as an absolute overlay inside a product card's (relative)
 * image container; `showLabel` renders an inline labeled pill for detail pages.
 */
export default function WishlistButton({ productId, category, className = '', showLabel = false }: WishlistButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();
  const [busy, setBusy] = useState(false);

  const saved = isSaved(productId, category);

  const handleClick = async (e: React.MouseEvent) => {
    // The button often lives inside/near a card <Link>; never navigate.
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (busy) return;
    setBusy(true);
    try {
      await toggle(productId, category);
    } finally {
      setBusy(false);
    }
  };

  const heart = (
    <svg
      viewBox="0 0 24 24"
      strokeWidth="1.6"
      stroke="currentColor"
      fill={saved ? 'currentColor' : 'none'}
      className={`w-[18px] h-[18px] ${saved ? 'text-stamp' : ''}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5l-1.3-1.18C6.06 15.1 3 12.34 3 8.94 3 6.3 5.08 4.25 7.7 4.25c1.48 0 2.9.68 3.8 1.76.9-1.08 2.32-1.76 3.8-1.76 2.62 0 4.7 2.05 4.7 4.69 0 3.4-3.06 6.16-7.7 10.38L12 20.5z"
      />
    </svg>
  );

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 px-5 py-3 border border-line text-ink hover:text-stamp hover:border-stamp transition-colors disabled:opacity-60 font-mono text-xs uppercase tracking-wide ${className}`}
        disabled={busy}
      >
        {heart}
        {saved ? 'Saved' : 'Save to wishlist'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`grid place-items-center w-9 h-9 bg-stone/90 backdrop-blur-sm border border-line text-ink hover:text-stamp transition-colors disabled:opacity-60 ${className}`}
      disabled={busy}
    >
      {heart}
    </button>
  );
}
