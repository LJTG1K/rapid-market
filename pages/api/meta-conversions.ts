import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMetaConversionEvent } from '../../lib/metaConversions';

interface ConversionData {
  email?: string;
  eventName: string;
  eventSourceUrl?: string;
  eventId?: string;
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  success: boolean;
  eventId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, eventName, eventSourceUrl, eventId } = req.body as ConversionData;

    if (!eventName) {
      return res.status(400).json({ error: 'eventName is required' });
    }

    const ip = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Callers that already fired a matching Pixel event client-side pass the
    // same eventId here for Meta's pixel/CAPI dedup; otherwise generate one.
    const resolvedEventId = eventId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await sendMetaConversionEvent({
      eventName,
      eventId: resolvedEventId,
      email,
      ip: ip as string | undefined,
      userAgent: req.headers['user-agent'],
      eventSourceUrl,
    });

    if (!result.success) {
      // Preserve the old stub's behavior of not failing the caller when the
      // token is simply unconfigured (e.g. local dev).
      if (result.error === 'missing-token') {
        return res.status(200).json({ success: true, eventId: 'skipped-no-token' });
      }
      return res.status(502).json({ error: `Meta API error: ${result.error}` });
    }

    return res.status(200).json({ success: true, eventId: result.eventId });
  } catch (error) {
    console.error('[Meta Conversions API] Exception:', error);
    return res.status(500).json({ error: 'Failed to send conversion event' });
  }
}
