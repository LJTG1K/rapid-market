/**
 * Client-side helpers for firing Reddit Pixel events. `eventId` is passed
 * through as `conversionId` so the server-side Reddit Conversions API call can
 * dedup against the browser event, the same way Meta's Pixel/CAPI pair dedups
 * on eventId.
 *
 * Buy-click and quiz-completion events go through lib/tracking.ts, which fires
 * both ad platforms and records the result in the pixel-event ledger.
 * `fireRedditPixelEvent` below is for one-off Reddit-only events.
 */
import { getRedditClickId } from './attribution';
import type { BrowserFireStatus } from './pixelEvents';

// Reddit's pixel only recognizes these as the primary `track()` name. Any
// other event name has to route through the 'Custom' event type instead,
// with the real name passed as `customEventName` — passing an arbitrary
// name directly is silently accepted by `rdt()` but never surfaces as a
// named event on Reddit's side.
const REDDIT_STANDARD_EVENTS = new Set([
  'PageVisit',
  'ViewContent',
  'Search',
  'AddToCart',
  'AddToWishlist',
  'Purchase',
  'Lead',
  'SignUp',
]);

/**
 * Browser-pixel half only. Returns what actually happened, for the
 * pixel-event ledger: the snippet in _document.tsx installs a queueing stub
 * for `rdt`, and Reddit's pixel.js defines `rdt.sendEvent` once it has really
 * loaded — a stub with no `sendEvent` means the event is only queued.
 */
export function sendRedditPixel(
  eventName: string,
  eventId: string,
  params: Record<string, unknown> = {}
): BrowserFireStatus {
  if (typeof window === 'undefined') return 'missing';
  const rdt = (window as any).rdt;
  if (typeof rdt !== 'function') return 'missing';
  try {
    if (REDDIT_STANDARD_EVENTS.has(eventName)) {
      rdt('track', eventName, { conversionId: eventId, ...params });
    } else {
      rdt('track', 'Custom', { customEventName: eventName, conversionId: eventId, ...params });
    }
  } catch {
    return 'error';
  }
  return typeof rdt.sendEvent === 'function' ? 'sent' : 'queued';
}

/**
 * Mirrors the event to Reddit's server-side Conversions API (see
 * lib/redditConversions.ts and pages/api/reddit-conversions.ts), sharing the
 * same eventId as the pixel call for Reddit's pixel/CAPI dedup, and reading
 * the rdt_cid click ID captured in lib/attribution.ts — the browser pixel
 * gets that from the page URL automatically, but a server-side call has no
 * access to it otherwise. Fire-and-forget: a slow/failed CAPI call must
 * never block or break the UI action that triggered it.
 */
function reportServerSideConversion(eventName: string, eventId: string): void {
  const clickId = getRedditClickId();
  fetch('/api/reddit-conversions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, eventId, clickId }),
    keepalive: true,
  }).catch(() => {
    // best-effort only
  });
}

export function fireRedditPixelEvent(
  eventName: string,
  eventId: string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;
  reportServerSideConversion(eventName, eventId);
  sendRedditPixel(eventName, eventId, params);
}
