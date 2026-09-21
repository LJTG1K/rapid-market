/**
 * Shared Reddit Conversions API (CAPI) sender, server-only. Mirrors every
 * client-side rdt() pixel call (see lib/redditPixel.ts) so Reddit still gets
 * the event if the browser pixel is blocked/lost, and so match quality has a
 * second signal (click_id/email/ip) beyond whatever the browser sent.
 *
 * Endpoint/schema per Reddit's documented Conversions API v2.0 (event_at,
 * event_type.tracking_type/custom_event_name, event_metadata.conversion_id
 * for pixel/CAPI dedup, click_id, user.email|ip_address|user_agent). Verify
 * against Ads Manager > Events Manager > Conversions API for this pixel if
 * Reddit ever returns a schema-validation error — that panel shows the exact
 * live endpoint/token for this account.
 */
import crypto from 'crypto';

const REDDIT_STANDARD_EVENTS = new Set([
  'PageVisit', 'ViewContent', 'Search', 'AddToCart',
  'AddToWishlist', 'Purchase', 'Lead', 'SignUp',
]);

export function hashSha256(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

export interface SendRedditConversionParams {
  eventName: string;
  eventId: string;
  clickId?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface SendRedditConversionResult {
  success: boolean;
  eventId: string;
  error?: string;
}

/** Never throws — a failed/misconfigured CAPI call must not break the caller's handler. */
export async function sendRedditConversionEvent(params: SendRedditConversionParams): Promise<SendRedditConversionResult> {
  const pixelId = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID || 'a2_jnll2uwvg52b';
  const accessToken = process.env.REDDIT_CONVERSIONS_API_TOKEN;

  if (!accessToken) {
    console.error(`[Reddit CAPI] ERROR: REDDIT_CONVERSIONS_API_TOKEN not configured — skipping ${params.eventName}`);
    return { success: false, eventId: params.eventId, error: 'missing-token' };
  }

  // Reddit requires at least one attribution/match signal per event.
  if (!params.clickId && !params.email && !params.ip) {
    console.error(`[Reddit CAPI] ERROR: no attribution signal (click_id/email/ip) for ${params.eventName} — skipping`);
    return { success: false, eventId: params.eventId, error: 'no-match-key' };
  }

  const eventType = REDDIT_STANDARD_EVENTS.has(params.eventName)
    ? { tracking_type: params.eventName }
    : { tracking_type: 'Custom', custom_event_name: params.eventName };

  const user: Record<string, string> = {};
  if (params.email) user.email = hashSha256(params.email);
  if (params.ip) user.ip_address = params.ip;
  if (params.userAgent) user.user_agent = params.userAgent;

  const payload = {
    test_mode: false,
    events: [
      {
        event_at: new Date().toISOString(),
        event_type: eventType,
        ...(params.clickId ? { click_id: params.clickId } : {}),
        event_metadata: { conversion_id: params.eventId },
        user,
      },
    ],
  };

  try {
    const response = await fetch(`https://ads-api.reddit.com/api/v2.0/conversions/events/${pixelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
      // Bounded: callers await this on Vercel, where the function freezes right after responding.
      signal: AbortSignal.timeout(5000),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(`[Reddit CAPI] ${params.eventName} error (${response.status}):`, responseData);
      return {
        success: false,
        eventId: params.eventId,
        error: (responseData && (responseData.message || responseData.error)) || `HTTP ${response.status}`,
      };
    }

    console.log(
      `[Reddit CAPI] ${params.eventName} sent (event_id ${params.eventId}, click_id ${params.clickId ? 'present' : 'MISSING'})`
    );
    return { success: true, eventId: params.eventId };
  } catch (error) {
    console.error(`[Reddit CAPI] ${params.eventName} exception:`, error);
    return { success: false, eventId: params.eventId, error: error instanceof Error ? error.message : 'exception' };
  }
}
