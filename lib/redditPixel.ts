/**
 * Client-side helper for firing Reddit Pixel events. Mirrors lib/metaPixel.ts
 * so every Sugargoo-exit click reports to both ad platforms from one call
 * site. `eventId` is passed through as `conversionId` so a future
 * server-side Reddit Conversions API call can dedup against this browser
 * event, the same way Meta's Pixel/CAPI pair already dedups on eventId.
 */
import { generateEventId } from './metaPixel';
import { getRedditClickId } from './attribution';
import type { StyleKey } from './styleMatch';

// Reddit's pixel only recognizes these as the primary `track()` name. Any
// other event name has to route through the 'Custom' event type instead,
// with the real name passed as `customEventName` — passing an arbitrary
// name directly (as this file used to) is silently accepted by `rdt()` but
// never surfaces as a named event on Reddit's side.
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
  const rdt = (window as any).rdt;
  if (typeof rdt !== 'function') return;
  if (REDDIT_STANDARD_EVENTS.has(eventName)) {
    rdt('track', eventName, { conversionId: eventId, ...params });
  } else {
    rdt('track', 'Custom', { customEventName: eventName, conversionId: eventId, ...params });
  }
}

// One custom event name per quiz style — kept distinct (rather than a single
// event carrying a `styles` list) because Reddit's audience builder segments
// on whether a *named* event fired, not on a value inside it. See "The Style
// Signal Loop" writeup for the full rationale.
export const QUIZ_STYLE_EVENT_NAMES: Record<StyleKey, string> = {
  minimal: 'QuizComplete_Minimal',
  streetwear: 'QuizComplete_Streetwear',
  techwear: 'QuizComplete_Techwear',
  avantgarde: 'QuizComplete_Runway',
};

/**
 * Fires once when the style quiz is completed: the standard `Lead` event,
 * which is what Stage 1's Conversions campaign actually optimizes delivery
 * against, plus one `QuizComplete_<Style>` custom event per style ticked
 * (multi-select means more than one can fire), which is what Stage 2's
 * per-style ad groups build their retargeting audiences from. Same submit,
 * two purposes — see components/StyleQuiz.tsx callers.
 */
export function fireQuizCompletePixelEvents(styles: StyleKey[]): void {
  const eventId = generateEventId();
  fireRedditPixelEvent('Lead', eventId, { context: 'quiz_complete', styles });
  styles.forEach((style) => {
    const eventName = QUIZ_STYLE_EVENT_NAMES[style];
    if (eventName) {
      fireRedditPixelEvent(eventName, eventId, { context: 'quiz_complete' });
    }
  });
}

/**
 * Fires on every Sugargoo-exit click: Reddit's standard `AddToCart` event,
 * plus the `SugargooBuyClick` custom event. Confirmed live in Ads Manager —
 * a campaign's Conversion goal picker only ever offers Reddit's fixed
 * standard events (Purchase, Lead, Sign up, Page visit, Add to cart), never
 * a custom event, no matter how it fires or what Events/Audience Manager
 * show elsewhere. `SugargooBuyClick` alone could never be a Stage 2 bidding
 * target because of that — `AddToCart` is the closest honest standard-event
 * fit for "clicked buy, hasn't paid yet" and is what Stage 2 actually
 * optimizes against; `SugargooBuyClick` still fires alongside it so
 * reporting can tell this click apart from a hypothetical future real cart.
 */
export function fireBuyClickPixelEvents(eventId: string, params: Record<string, unknown> = {}): void {
  fireRedditPixelEvent('AddToCart', eventId, params);
  fireRedditPixelEvent('SugargooBuyClick', eventId, params);
}
