import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

interface ConversionData {
  email?: string;
  eventName: string;
  eventSourceUrl?: string;
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  success: boolean;
  eventId?: string;
}

/**
 * Hash email for Meta Conversions API (SHA-256)
 */
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, eventName, eventSourceUrl } = req.body as ConversionData;

    // Validation
    if (!email || !eventName) {
      return res.status(400).json({ error: 'Email and eventName are required' });
    }

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '951122617742977';
    const accessToken = process.env.META_CONVERSIONS_API_TOKEN;

    console.log(`[Meta Conversions API] Token check: ${accessToken ? 'PRESENT (' + accessToken.substring(0, 20) + '...)' : 'MISSING'}`);

    if (!accessToken) {
      console.error('[Meta Conversions API] ERROR: No access token configured!');
      console.error('[Meta Conversions API] Expected env var: META_CONVERSIONS_API_TOKEN');
      return res.status(200).json({ success: true, eventId: 'skipped-no-token' });
    }

    const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: timestamp,
          event_id: eventId,
          event_source_url: eventSourceUrl || 'https://rapid.market/signup',
          user_data: {
            em: hashEmail(email), // Hashed email
          },
        },
      ],
      access_token: accessToken,
    };

    console.log(`[Meta Conversions API] Sending ${eventName} event for ${email}`);

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[Meta Conversions API] Error:', responseData);
      return res.status(response.status).json({
        error: `Meta API error: ${responseData.error?.message || 'Unknown error'}`,
      });
    }

    console.log(`[Meta Conversions API] Event sent successfully. Event ID: ${eventId}`);

    return res.status(200).json({
      success: true,
      eventId,
    });
  } catch (error) {
    console.error('[Meta Conversions API] Exception:', error);
    return res.status(500).json({ error: 'Failed to send conversion event' });
  }
}
