/**
 * The one client-side entry point for the two conversion actions RAPID
 * reports to ad platforms: exiting to Sugargoo ("buy click") and completing
 * the style quiz. Every page calls these instead of firing pixels itself, so
 * all pages send the same events to both Meta and Reddit (what fires is
 * defined once, in lib/pixelEvents.ts).
 *
 * Each call (1) fires the browser pixels, (2) records whether each pixel was
 * really live, and (3) reports to /api/pixel-events, which fires the matching
 * server-side Conversions API events and writes the pixel-event ledger
 * (lib/db/pixelEvents.ts) shown at /admin/pixel-events.
 */
import Router from 'next/router';
import { generateEventId, fireMetaPixelEvent } from './metaPixel';
import { sendRedditPixel } from './redditPixel';
import { getAttribution, getRedditClickId } from './attribution';
import {
  planEvents,
  metaCustomData,
  type BrowserFireStatus,
  type EventData,
  type LogicalEvent,
  type PixelPlatform,
} from './pixelEvents';
import type { StyleKey } from './styleMatch';

interface BrowserResult {
  platform: PixelPlatform;
  name: string;
  status: BrowserFireStatus;
}

function redditParams(event: LogicalEvent, eventName: string, data: EventData): Record<string, unknown> {
  if (event === 'buy_click') {
    return {
      ...(data.productId ? { products: [{ id: data.productId, name: data.productName }] } : {}),
      ...(data.context ? { context: data.context } : {}),
    };
  }
  // The per-style QuizComplete_<Style> events carry no extra payload — the
  // event name itself is the signal. Only the standard Lead lists the styles.
  return eventName === 'Lead' ? { context: 'quiz_complete', styles: data.styles } : { context: 'quiz_complete' };
}

/** The route pattern (e.g. /product/[id]) so ledger rows group by page type, not by product. */
function currentRoute(): string {
  try {
    return Router.pathname || window.location.pathname;
  } catch {
    return window.location.pathname;
  }
}

function dispatch(event: LogicalEvent, eventId: string, data: EventData): void {
  if (typeof window === 'undefined') return;

  const browser: BrowserResult[] = planEvents(event, data.styles).map(({ platform, name }) => {
    let status: BrowserFireStatus;
    try {
      status =
        platform === 'meta'
          ? fireMetaPixelEvent(name, eventId, metaCustomData(event, data))
          : sendRedditPixel(name, eventId, redditParams(event, name, data));
    } catch {
      status = 'error';
    }
    return { platform, name, status };
  });

  const attribution = getAttribution();

  // Fire-and-forget with keepalive so the request survives a same-tab
  // navigation to Sugargoo. A slow or failed report must never affect the click.
  fetch('/api/pixel-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      event,
      eventId,
      ...data,
      pagePath: currentRoute(),
      // Origin + path only: the query string can carry click IDs we don't want in a URL sent onward.
      pageUrl: `${window.location.origin}${window.location.pathname}`,
      channel: attribution?.channel,
      utmMedium: attribution?.utmMedium,
      utmCampaign: attribution?.utmCampaign,
      clickId: getRedditClickId(),
      browser,
    }),
  }).catch(() => {
    // best-effort only
  });
}

/**
 * Call from the onClick of any link/button that exits to Sugargoo. Returns the
 * shared eventId so callers that also log the click elsewhere (e.g. /api/track)
 * can tag it with the same ID.
 */
export function trackBuyClick(data: { productId?: string; productName?: string; context?: string } = {}): string {
  const eventId = generateEventId();
  dispatch('buy_click', eventId, data);
  return eventId;
}

/** Call once each time the style quiz is completed. */
export function trackQuizComplete(styles: StyleKey[]): void {
  dispatch('quiz_complete', generateEventId(), { styles });
}
