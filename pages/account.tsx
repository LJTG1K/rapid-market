import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Reveal from '@/components/Reveal';
import WishlistButton from '@/components/WishlistButton';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  sugargooLink: string;
  category: string;
}

interface SavedProduct extends Product {
  savedCategory: string; // the wishlist bucket ("fashion"/"tech") the item was saved under
}

export default function Account() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { isSaved, ready: wishlistReady } = useWishlist();

  const [items, setItems] = useState<SavedProduct[]>([]);
  const [wlLoading, setWlLoading] = useState(true);

  // Auth guard — bounce to login once we know there's no session.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=/account');
    }
  }, [loading, user, router]);

  // Load the wishlist rows, then resolve each to a full product via /api/products.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setWlLoading(true);
      try {
        const wlRes = await fetch('/api/wishlist');
        const wlData = await wlRes.json();
        const rows: Array<{ product_id: string; category: string }> = wlData.items ?? [];

        if (rows.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        const categories = Array.from(new Set(rows.map((r) => r.category)));
        const byCategory: Record<string, Product[]> = {};
        await Promise.all(
          categories.map(async (cat) => {
            const res = await fetch(`/api/products?category=${encodeURIComponent(cat)}`);
            byCategory[cat] = await res.json();
          })
        );

        const resolved: SavedProduct[] = [];
        rows.forEach((row) => {
          const match = (byCategory[row.category] ?? []).find((p) => p.id === row.product_id);
          if (match) resolved.push({ ...match, savedCategory: row.category });
        });

        if (!cancelled) setItems(resolved);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setWlLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  // While auth is resolving or a redirect is in flight, render nothing heavy.
  if (loading || !user) {
    return (
      <>
        <Head>
          <title>Your Account — RAPID</title>
        </Head>
        <div className="container-edit py-24 text-center">
          <p className="font-mono text-sm text-muted">Loading…</p>
        </div>
      </>
    );
  }

  // Keep the grid in sync with live un-saves (clicking a heart updates context).
  const visibleItems = items.filter((p) => isSaved(p.id, p.savedCategory));

  // Gate on the wishlist context loading too, so isSaved doesn't transiently
  // filter everything out (empty-state flash) before the context has loaded.
  const showSkeleton = wlLoading || !wishlistReady;

  return (
    <>
      <Head>
        <title>Your Account — RAPID</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <Reveal>
          <span className="eyebrow block mb-3">Your Account</span>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <h1 className="font-display font-black text-ink text-5xl md:text-6xl tracking-tightest leading-[0.9] mb-3">
                {user.name || 'Welcome'}
              </h1>
              <p className="font-mono text-sm text-muted">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Log out
            </button>
          </div>
        </Reveal>

        <Reveal as="section" className="border-t border-line pt-10">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-display font-black text-3xl md:text-4xl tracking-tightest">
              Your wishlist
            </h2>
            {!showSkeleton && (
              <span className="eyebrow hidden sm:inline">
                {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>

          {showSkeleton ? (
            <ProductGridSkeleton count={3} aspect="4:5" />
          ) : visibleItems.length === 0 ? (
            <div className="py-8">
              <p className="text-ink/70 mb-6 max-w-md">
                You haven&apos;t saved anything yet. Tap the heart on any product across
                the index to keep it here.
              </p>
              <Link href="/fashion-listings" className="btn-stamp">Browse the index →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
              {visibleItems.map((product) => (
                <div key={`${product.savedCategory}:${product.id}`} className="flex flex-col relative">
                  <WishlistButton
                    productId={product.id}
                    category={product.savedCategory}
                    className="absolute top-2 right-2 z-10"
                  />
                  <Link href={`/product/${product.id}?category=${product.savedCategory}`} className="group">
                    <div className="aspect-[4/5] bg-paper border border-line overflow-hidden mb-3">
                      <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-stamp transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <span className="font-mono text-sm">{product.price}</span>
                    <a
                      href={product.sugargooLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary !px-4 !py-2 text-[11px]"
                    >
                      Buy
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </>
  );
}
