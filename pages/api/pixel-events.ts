import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdFromRequest } from '../../lib/auth/session';
import { findUserById } from '../../lib/auth/users';
import { sendMetaConversionEvent } from '../../lib/metaConversions';
import { sendRedditConversionEvent } from '../../lib/redditConversions';
import { logPixelEvents, type PixelEventRow } from '../../lib/db/pixelEvents';
import {
  isLogicalEvent,
  metaCustomData,
  planEvents,
  VALID_STYLES,
  type BrowserFireStatus,
  type EventData,
  type PlannedEvent,
  type PixelPlatform,
  type ServerFireStatus,
} from '../../lib/pixelEvents';
import type { StyleKey } from '../../lib/styleMatch';

/**
 * Receives one report per buy click / quiz completion from lib/tracking.ts and:
 *  1. fires the matching server-side Conversions API events (Meta + Reddit),
 *     sharing the browser pixels' eventId so each platform can dedup, and
 *  2. writes the pixel-event ledger — one row per platform event for what the
 *     browser reported, one for what our CAPI call returned.
 *
 * The client names only the *logical* event; which platform events that means
 * comes from lib/pixelEvents.ts. Visitors therefore can't use this public
 * endpoint to make us send arbitrary conversions to Meta or Reddit.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rapid.market';
const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const BROWSER_STATUSES: BrowserFireStatus[] = ['sent', 'queued', 'missing', 'error'];

function str(value: unknown, max: number): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value.slice(0, max) : undefined;
}

/** The page's origin + path, only if it's on our own site — this becomes Meta's event_source_url. */
function ownPageUrl(value: unknown): string {
  try {
    const url = new URL(String(value));
    if (url.host === new URL(SITE_URL).host) return `${url.origin}${url.pathname}`;
  } catch {
    // fall through
  }
  return SITE_URL;
}

interface ServerOutcome {
  status: ServerFireStatus;
  error?: string;
}

function toOutcome(result: { success: boolean; error?: string }, skippedReasons: string[]): ServerOutcome {
  if (result.success) return { status: 'success' };
  if (result.error && skippedReasons.includes(result.error)) return { status: 'skipped', error: result.error };
  return { status: 'error', error: result.error || 'unknown' };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body ?? {};
  if (!isLogicalEvent(body.event)) {
    return res.status(400).json({ error: 'Unknown event' });
  }
  if (typeof body.eventId !== 'string' || !EVENT_ID_PATTERN.test(body.eventId)) {
    return res.status(400).json({ error: 'Invalid eventId' });
  }

  const event = body.event;
  const eventId: string = body.eventId;
  const styles: StyleKey[] = Array.isArray(body.styles)
    ? VALID_STYLES.filter((style) => body.styles.includes(style))
    : [];
  const data: EventData = {
    productId: str(body.productId, 200),
    productName: str(body.productName, 300),
    context: str(body.context, 50),
    styles,
  };
  const planned = planEvents(event, styles);

  const pageUrl = ownPageUrl(body.pageUrl);
  const clickId = str(body.clickId, 200);
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const userId = getUserIdFromRequest(req);
  let email: string | null = null;
  if (userId) {
    try {
      email = (await findUserById(userId))?.email ?? null;
    } catch {
      // Match-quality only — never block the event on a user lookup.
    }
  }

  // Local/preview traffic must not send real conversions to the production
  // pixels; the ledger is still written so the flow can be tested end to end.
  const sendServerSide = process.env.NODE_ENV === 'production' || process.env.PIXEL_EVENTS_SEND_IN_DEV === '1';

  const sendOne = async (planned: PlannedEvent): Promise<ServerOutcome> => {
    if (!sendServerSide) return { status: 'skipped', error: 'non-production' };
    if (planned.platform === 'meta') {
      const result = await sendMetaConversionEvent({
        eventName: planned.name,
        eventId,
        email,
        ip,
        userAgent,
        eventSourceUrl: pageUrl,
        fbp: str(req.cookies._fbp, 200),
        fbc: str(req.cookies._fbc, 200),
        customData: metaCustomData(event, data),
      });
      return toOutcome(result, ['missing-token']);
    }
    const result = await sendRedditConversionEvent({
      eventName: planned.name,
      eventId,
      clickId,
      email,
      ip,
      userAgent,
    });
    return toOutcome(result, ['missing-token', 'no-match-key']);
  };

  // Awaited (not deferred): Vercel freezes the function as soon as the
  // response is sent. Each CAPI call is bounded by its own timeout.
  const outcomes = await Promise.all(planned.map(sendOne));

  const base = {
    event_id: eventId,
    logical_event: event,
    page_path: str(body.pagePath, 200) ?? null,
    channel: str(body.channel, 100) ?? null,
    utm_medium: str(body.utmMedium, 100) ?? null,
    utm_campaign: str(body.utmCampaign, 200) ?? null,
    product_id: data.productId ?? null,
    user_id: userId,
    params: {
      ...(data.productName ? { product_name: data.productName } : {}),
      ...(data.context ? { context: data.context } : {}),
      ...(styles.length > 0 ? { styles } : {}),
    },
  };

  const rows: PixelEventRow[] = [];

  // Browser rows: only accept reports for events we actually planned, so a
  // forged body can't write arbitrary rows.
  const reported: unknown[] = Array.isArray(body.browser) ? body.browser : [];
  for (const { platform, name } of planned) {
    const match = reported.find(
      (r): r is { platform: PixelPlatform; name: string; status: BrowserFireStatus } =>
        !!r && typeof r === 'object' && (r as any).platform === platform && (r as any).name === name
    );
    if (match && BROWSER_STATUSES.includes(match.status)) {
      rows.push({ ...base, platform, platform_event: name, source: 'browser', status: match.status });
    }
  }

  planned.forEach(({ platform, name }, i) => {
    rows.push({
      ...base,
      platform,
      platform_event: name,
      source: 'server',
      status: outcomes[i].status,
      error: outcomes[i].error ?? null,
    });
  });

  try {
    await logPixelEvents(rows);
  } catch (error) {
    // Most likely sql/pixel_events.sql hasn't been run yet. Never fail the caller over the ledger.
    console.error('⚠️ Pixel-event ledger write failed (non-blocking):', error instanceof Error ? error.message : error);
  }

  return res.status(200).json({ ok: true });
}
