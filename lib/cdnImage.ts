/**
 * Product photographs arrive from the Google Sheet as raw seller-CDN URLs, and
 * the overwhelming majority are full-size originals (~0.2-1.2 MB) that then get
 * shrunk into an 80px-400px card by CSS. The Alibaba/Taobao image CDN resizes
 * on demand if you append a transform suffix, so we can ask it for a card-sized
 * rendition instead. Costs nothing and needs no image proxy of our own.
 *
 * Measured against the live catalogue (1068 products) at width 400:
 *   1.18 MB jpeg -> 10.5 KB webp
 *   687 KB  png  ->  4.2 KB webp
 *
 * ~96% of the catalogue is on this CDN. Everything else (i.ibb.co,
 * www.sugargoo.com) is deliberately passed through untouched.
 */

/** Hosts known to accept an inline transform suffix. */
const CDN_HOST = /(^|\.)(alicdn|taobaocdn)\.com$/i;

/**
 * Splits "<base>.<ext>" from an optional existing transform suffix.
 *
 * The lazy `.*?` is load-bearing: the CDN keys its transform off the FIRST
 * extension in the path, so `.../foo.png_q95.jpg_.webp` has base `.../foo.png`.
 * Matching only `.jpg` here would latch onto the `.jpg` *inside* the existing
 * suffix and yield a 404 — verified against real gw.alicdn.com URLs.
 */
const BASE_AND_SUFFIX = /^(.*?\.(?:jpg|jpeg|png|webp))(?:_[^/?#]*)?$/i;

export const VARIANT_WIDTH = { thumb: 200, card: 400, detail: 800 } as const;

export type ImageVariant = keyof typeof VARIANT_WIDTH;

/**
 * Ask the seller's CDN for a `width`-square rendition of `src`.
 *
 * Defensive by construction: an unrecognised host, an unparseable URL, or a
 * path with no extension is returned verbatim, so a new image host appearing in
 * the sheet can never break rendering.
 */
export function cdnResize(src: string, width: number, quality = 80): string {
  let hostname: string;
  try {
    hostname = new URL(src).hostname;
  } catch {
    return src; // relative or malformed
  }
  if (!CDN_HOST.test(hostname)) return src;

  const match = src.match(BASE_AND_SUFFIX);
  if (!match) return src;

  // `_WxHqQ.jpg_.webp` is the only shape this CDN honours; `.png`/`.webp`
  // output directives return 404. The `.jpg` is a directive, not the real
  // output format — the trailing `_.webp` is what makes it serve WebP.
  return `${match[1]}_${width}x${width}q${quality}.jpg_.webp`;
}
