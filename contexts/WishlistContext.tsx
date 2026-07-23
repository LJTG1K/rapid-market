import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

/** Stored as a Set of "category:productId" keys. */
function keyOf(productId: string, category: string): string {
  return `${category}:${productId}`;
}

interface WishlistContextValue {
  /** Whether the wishlist has loaded for the current user. */
  ready: boolean;
  isSaved: (productId: string, category: string) => boolean;
  /** Optimistically add/remove and persist. Returns the new saved state. */
  toggle: (productId: string, category: string) => Promise<boolean>;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  // Load (or clear) the wishlist whenever the logged-in user changes.
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setSaved(new Set());
      setReady(true);
      return;
    }

    setReady(false);
    fetch('/api/wishlist')
      .then((r) => r.json())
      .then((data: { items?: Array<{ product_id: string; category: string }> }) => {
        if (cancelled) return;
        const next = new Set<string>();
        (data.items ?? []).forEach((i) => next.add(keyOf(i.product_id, i.category)));
        setSaved(next);
      })
      .catch(() => {
        if (!cancelled) setSaved(new Set());
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const isSaved = useCallback(
    (productId: string, category: string) => saved.has(keyOf(productId, category)),
    [saved]
  );

  const toggle = useCallback(
    async (productId: string, category: string): Promise<boolean> => {
      const key = keyOf(productId, category);
      const currentlySaved = saved.has(key);
      const nextSaved = !currentlySaved;

      // Optimistic update.
      setSaved((prev) => {
        const next = new Set(prev);
        if (nextSaved) next.add(key);
        else next.delete(key);
        return next;
      });

      try {
        const res = await fetch('/api/wishlist', {
          method: nextSaved ? 'POST' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, category }),
        });
        if (!res.ok) throw new Error('request failed');
      } catch {
        // Roll back on failure.
        setSaved((prev) => {
          const next = new Set(prev);
          if (nextSaved) next.delete(key);
          else next.add(key);
          return next;
        });
        return currentlySaved;
      }

      return nextSaved;
    },
    [saved]
  );

  return (
    <WishlistContext.Provider value={{ ready, isSaved, toggle, count: saved.size }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
