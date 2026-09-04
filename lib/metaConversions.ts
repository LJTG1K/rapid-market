/**
 * Shared Meta Conversions API (CAPI) sender, server-only. Extracted out of
 * pages/api/meta-conversions.ts so other API routes (e.g. pages/api/track.ts,
 * pages/api/qualified-lead.ts) can fire a CAPI event directly — without a
 * self-HTTP round trip — while sharing the same event_id as the client-side
 * Pixel call for Meta's pixel/CAPI dedup.
 */
import crypto from 'crypto';

export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export interface SendConversionParams {
  eventName: string;
  eventId: string;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  eventSourceUrl?: string;
}

export interface SendConversionResult {
  success: boolean;
  eventId: string;
  error?: string;
}

/** Never throws — a failed/misconfigured CAPI call must not break the caller's handler. */
export async function sendMetaConversionEvent(params: SendConversionParams): Promise<SendConversionResult> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '951122617742977';
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;

  if (!accessToken) {
    console.error(`[Meta CAPI] ERROR: META_CONVERSIONS_API_TOKEN not configured — skipping ${params.eventName}`);
    return { success: false, eventId: params.eventId, error: 'missing-token' };
  }

  const userData: Record<string, string> = {};
  if (params.email) userData.em = hashEmail(params.email);
  if (params.ip) userData.client_ip_address = params.ip;
  if (params.userAgent) userData.client_user_agent = params.userAgent;

  const payload = {
    data: [
      {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        event_source_url: params.eventSourceUrl || 'https://rapid.market',
        action_source: 'website',
        user_data: userData,
      },
    ],
    access_token: accessToken,
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[Meta CAPI] ${params.eventName} error:`, responseData);
      return { success: false, eventId: params.eventId, error: responseData.error?.message || 'Unknown error' };
    }

    console.log(`[Meta CAPI] ${params.eventName} sent (event_id ${params.eventId})`);
    return { success: true, eventId: params.eventId };
  } catch (error) {
    console.error(`[Meta CAPI] ${params.eventName} exception:`, error);
    return { success: false, eventId: params.eventId, error: error instanceof Error ? error.message : 'exception' };
  }
}
