import type { NextApiRequest, NextApiResponse } from 'next';
import { sendRedditConversionEvent } from '../../lib/redditConversions';
import { getUserIdFromRequest } from '../../lib/auth/session';
import { findUserById } from '../../lib/auth/users';

interface ConversionRequestBody {
  eventName: string;
  eventId: string;
  clickId?: string | null;
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
    const { eventName, eventId, clickId } = req.body as ConversionRequestBody;

    if (!eventName || !eventId) {
      return res.status(400).json({ error: 'eventName and eventId are required' });
    }

    const ip = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Logged-in visitors give us an email match key in addition to click_id —
    // both are sent when available, since Reddit scores match quality across
    // whichever signals are present.
    const userId = getUserIdFromRequest(req);
    const user = userId ? await findUserById(userId) : null;

    const result = await sendRedditConversionEvent({
      eventName,
      eventId,
      clickId,
      email: user?.email,
      ip: ip as string | undefined,
      userAgent: req.headers['user-agent'],
    });

    if (!result.success) {
      // Don't fail the caller (the client pixel call already fired) when the
      // token is simply unconfigured or there's genuinely no match key yet.
      if (result.error === 'missing-token' || result.error === 'no-match-key') {
        return res.status(200).json({ success: true, eventId: `skipped-${result.error}` });
      }
      return res.status(502).json({ error: `Reddit CAPI error: ${result.error}` });
    }

    return res.status(200).json({ success: true, eventId: result.eventId });
  } catch (error) {
    console.error('[Reddit Conversions API] Exception:', error);
    return res.status(500).json({ error: 'Failed to send conversion event' });
  }
}
