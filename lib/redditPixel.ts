/**
 * Client-side helper for firing Reddit Pixel events. Mirrors lib/metaPixel.ts
 * so every Sugargoo-exit click reports to both ad platforms from one call
 * site. `eventId` is passed through as `conversionId` so a future
 * server-side Reddit Conversions API call can dedup against this browser
 * event, the same way Meta's Pixel/CAPI pair already dedups on eventId.
 */

export function fireRedditPixelEvent(
  eventName: string,
  eventId: string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;
  const rdt = (window as any).rdt;
  if (typeof rdt !== 'function') return;
  rdt('track', eventName, { conversionId: eventId, ...params });
}
