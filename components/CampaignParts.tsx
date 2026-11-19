import Link from 'next/link';
import ProductImage from './ProductImage';
import VerifiedTick from './VerifiedTick';
import Stars from './Stars';

/**
 * Shared building blocks for the paid-traffic landing pages (/campaign for
 * Meta, /reddit for Reddit). Every signup button points at /signup, which
 * owns the signup tracking, so these pages add no tracking of their own.
 */

export interface CampaignProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  sugargooLink: string;
  category: string;
  brand?: string;
  brandSlug?: string;
  itemName?: string;
}

/** Rating + hauls chips used under hero buttons and in the final band. */
export function TrustChips({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[13px]">
        <Stars size={12} />
        <span><b className="font-semibold">4.8</b> seller rating</span>
      </span>
      <span className="inline-flex items-center rounded-full border border-line bg-white px-3 py-1.5 text-[13px]">
        <b className="font-semibold mr-1">47,000+</b> hauls shipped
      </span>
    </div>
  );
}

/** Compact product tile for hero walls: photo, verified brand line, item name. */
export function CampaignTile({ product, priority = false }: { product: CampaignProduct; priority?: boolean }) {
  return (
    <Link href={`/product/${product.id}?category=fashion`} className="group block min-w-0">
      <span className="block aspect-[4/5] rounded-md overflow-hidden bg-paper mb-2">
        <ProductImage src={product.image} alt="" priority={priority} />
      </span>
      {product.brand && (
        <span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.06em] text-ink truncate">
          <span className="truncate">{product.brand}</span>
          <VerifiedTick className="!w-3 !h-3" />
        </span>
      )}
      <span className="block text-[13px] font-semibold leading-snug line-clamp-1 group-hover:underline">
        {product.itemName || product.name}
      </span>
    </Link>
  );
}

/** Picks n products with photos from different brands, newest first, for a varied wall. */
export function pickVariedProducts(all: CampaignProduct[], n: number): CampaignProduct[] {
  const seen = new Set<string>();
  const out: CampaignProduct[] = [];
  for (const p of [...all].sort((a, b) => Number(b.id) - Number(a.id))) {
    if (!p.image || !p.brand || seen.has(p.brand)) continue;
    seen.add(p.brand);
    out.push(p);
    if (out.length === n) break;
  }
  return out;
}

/** Phone-only signup bar fixed to the bottom of the screen. */
export function StickySignup() {
  return (
    <>
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line px-4 pt-3 flex items-center justify-between gap-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <span className="text-[13px] text-muted">Free · takes 30 seconds</span>
        <Link href="/signup" className="btn-stamp !py-2.5">
          Create free account
        </Link>
      </div>
      {/* Keeps the last section clear of the bar on phones. */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="border-t border-line">
      {items.map((faq) => (
        <details key={faq.q} className="group border-b border-line">
          <summary className="flex items-center justify-between gap-6 cursor-pointer list-none py-5">
            <span className="font-semibold text-[17px]">{faq.q}</span>
            <span
              className="w-7 h-7 rounded-full border border-line grid place-items-center shrink-0 transition-transform group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="text-muted leading-relaxed pb-5 max-w-[60ch]">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Closing signup band. */
export function SignupBand({ title, body }: { title: string; body?: string }) {
  return (
    <section className="container-edit pb-20 md:pb-28">
      <div className="bg-paper rounded-2xl px-6 py-12 md:py-16 text-center grid justify-items-center gap-5">
        <h2 className="font-display text-ink text-3xl md:text-5xl leading-[1.02] max-w-[18ch]">{title}</h2>
        {body && <p className="text-muted max-w-[46ch]">{body}</p>}
        <Link href="/signup" className="btn-stamp !px-8 !py-3.5 text-[15px]">
          Create free account
        </Link>
        <TrustChips className="justify-center" />
      </div>
    </section>
  );
}
