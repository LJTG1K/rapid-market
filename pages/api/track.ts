import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface TrackingEvent {
  timestamp: string;
  type: 'product-click' | 'signup-click' | 'page-view';
  productId?: string;
  productName?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, productName, type, url } = req.body;

    // Create tracking event
    const ip = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const event: TrackingEvent = {
      timestamp: new Date().toISOString(),
      type: type || 'product-click',
      productId,
      productName,
      url,
      userAgent: req.headers['user-agent'],
      ip: ip as string | undefined,
    };

    // Log to file (development) or send to external service (production)
    if (process.env.NODE_ENV === 'development') {
      const logFile = path.join(process.cwd(), 'logs', 'analytics.jsonl');
      const logDir = path.dirname(logFile);

      // Create logs directory if it doesn't exist
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Append event to analytics log
      fs.appendFileSync(logFile, JSON.stringify(event) + '\n');
    } else {
      // In production, send to analytics service
      // Example: Google Analytics, Mixpanel, PostHog, or custom endpoint
      console.log('Track event (production):', event);

      // TODO: Implement production analytics
      // await sendToAnalyticsService(event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Tracking failed' });
  }
}
