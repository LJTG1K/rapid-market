/**
 * Shared Meta Conversions API (CAPI) sender, server-only. Extracted out of
 * pages/api/meta-conversions.ts so other API routes (e.g. pages/api/track.ts,
 * pages/api/qualified-lead.ts) can fire a CAPI event directly — without a
 * self-HTTP round trip — while sharing the same event_id as the client-side
 * Pixel call for Meta's pixel/CAPI dedup.
 */
import crypto from 'crypto';

/**
 * True on the production deployment. Same rule as before (NODE_ENV=production),
 * except a deployment Vercel marks as preview/development no longer counts —
 * previews were sending real CAPI events to the live dataset.
 */
export function isLiveDeployment(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  return process.env.NODE_ENV === 'production' && vercelEnv !== 'preview' && vercelEnv !== 'development';
}

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
  /** Meta's _fbp / _fbc browser cookies — extra match keys that also improve pixel/CAPI dedup. */
  fbp?: string | null;
  fbc?: string | null;
  customData?: Record<string, unknown>;
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

  // Off the live deployment, events may only go to Events Manager → Test
  // Events (META_TEST_EVENT_CODE), which never counts toward the dataset or
  // campaign optimisation. Without a code they are skipped.
  const testEventCode = isLiveDeployment() ? undefined : process.env.META_TEST_EVENT_CODE?.trim() || undefined;
  if (!isLiveDeployment() && !testEventCode) {
    return { success: false, eventId: params.eventId, error: 'non-production' };
  }

  if (!accessToken) {
    console.error(`[Meta CAPI] ERROR: META_CONVERSIONS_API_TOKEN not configured — skipping ${params.eventName}`);
    return { success: false, eventId: params.eventId, error: 'missing-token' };
  }

  const userData: Record<string, string> = {};
  if (params.email) userData.em = hashEmail(params.email);
  if (params.ip) userData.client_ip_address = params.ip;
  if (params.userAgent) userData.client_user_agent = params.userAgent;
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;

  const payload = {
    data: [
      {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        event_source_url: params.eventSourceUrl || 'https://rapid.market',
        action_source: 'website',
        user_data: userData,
        ...(params.customData && Object.keys(params.customData).length > 0
          ? { custom_data: params.customData }
          : {}),
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
    access_token: accessToken,
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Bounded: callers await this on Vercel, where the function freezes right after responding.
      signal: AbortSignal.timeout(5000),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[Meta CAPI] ${params.eventName} error:`, responseData);
      return { success: false, eventId: params.eventId, error: responseData.error?.message || 'Unknown error' };
    }

    console.log(
      `[Meta CAPI] ${params.eventName} sent (event_id ${params.eventId})${testEventCode ? ` to Test Events (${testEventCode})` : ''}`
    );
    return { success: true, eventId: params.eventId };
  } catch (error) {
    console.error(`[Meta CAPI] ${params.eventName} exception:`, error);
    return { success: false, eventId: params.eventId, error: error instanceof Error ? error.message : 'exception' };
  }
}
