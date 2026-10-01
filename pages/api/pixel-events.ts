import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdFromRequest } from '../../lib/auth/session';
import { findUserById } from '../../lib/auth/users';
import { isLiveDeployment, sendMetaConversionEvent } from '../../lib/metaConversions';
import { sendRedditConversionEvent } from '../../lib/redditConversions';
import { isBotUserAgent } from '../../lib/botFilter';
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

const bareHost = (host: string) => host.replace(/^www\./, '');

/**
 * The page's origin + path, only if it's on our own site — this becomes Meta's
 * event_source_url. The site is served from www.rapid.market while SITE_URL is
 * the apex, so compare hosts without the `www.` (an exact match sent every
 * server event's URL as the homepage).
 */
function ownPageUrl(value: unknown): string {
  try {
    const url = new URL(String(value));
    if (bareHost(url.host) === bareHost(new URL(SITE_URL).host)) return `${url.origin}${url.pathname}`;
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
  const utmContent = str(body.utmContent, 200);
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
  // pixels. Meta decides for itself (lib/metaConversions.ts: live deployment,
  // or Test Events when META_TEST_EVENT_CODE is set); Reddit has no test mode
  // wired up, so it sends only from the live deployment unless explicitly
  // opted in.
  const live = isLiveDeployment();
  const sendRedditServerSide = live || process.env.PIXEL_EVENTS_SEND_IN_DEV === '1';

  const fbp = str(req.cookies._fbp, 200);
  const fbc = str(req.cookies._fbc, 200);

  // Keep automated traffic out of the events campaigns optimise on. Bots that
  // announce themselves are dropped for every platform. For Meta we also
  // require some sign the visitor is a real browser Meta can match: the _fbp
  // cookie (set only once fbevents.js has actually run), an _fbc click cookie,
  // or a logged-in user. Without one, the event matches on IP + user agent
  // only, and the 2026-09 audit found ~65% of ClickToSugargoo CAPI events in
  // exactly that state, concentrated in unattributed traffic.
  const botReason: string | null =
    body.bot === true ? 'bot-browser' : isBotUserAgent(userAgent) ? 'bot-ua' : null;
  const hasBrowserSignal = !!fbp || !!fbc || !!userId;

  const sendOne = async (planned: PlannedEvent): Promise<ServerOutcome> => {
    if (botReason) return { status: 'skipped', error: botReason };
    if (planned.platform === 'meta') {
      if (!hasBrowserSignal) return { status: 'skipped', error: 'no-browser-signal' };
      const result = await sendMetaConversionEvent({
        eventName: planned.name,
        eventId,
        email,
        ip,
        userAgent,
        eventSourceUrl: pageUrl,
        fbp,
        fbc,
        customData: metaCustomData(event, data),
      });
      return toOutcome(result, ['missing-token', 'non-production']);
    }
    if (!sendRedditServerSide) return { status: 'skipped', error: 'non-production' };
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
    utm_content: utmContent ?? null,
    product_id: data.productId ?? null,
    user_id: userId,
    params: {
      ...(data.productName ? { product_name: data.productName } : {}),
      ...(data.context ? { context: data.context } : {}),
      ...(styles.length > 0 ? { styles } : {}),
      // Also in params so it survives on rows written before the utm_content
      // column exists (lib/db/pixelEvents.ts retries without the column).
      ...(utmContent ? { utm_content: utmContent } : {}),
      // Kept so bot filtering can be audited and tuned from the ledger.
      ...(userAgent ? { user_agent: userAgent.slice(0, 300) } : {}),
      has_fbp: !!fbp,
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

  // The ledger table lives in the production Supabase project, so local and
  // preview runs log their rows instead of mixing test clicks into the real
  // counts. PIXEL_LEDGER_IN_DEV=1 writes them anyway.
  if (!live && process.env.PIXEL_LEDGER_IN_DEV !== '1') {
    console.log('[pixel-events] ledger rows (not written outside production):', JSON.stringify(rows));
    return res.status(200).json({ ok: true });
  }

  try {
    await logPixelEvents(rows);
  } catch (error) {
    // Most likely sql/pixel_events.sql hasn't been run yet. Never fail the caller over the ledger.
    console.error('⚠️ Pixel-event ledger write failed (non-blocking):', error instanceof Error ? error.message : error);
  }

  return res.status(200).json({ ok: true });
}
