import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getUserIdFromRequest } from '../../lib/auth/session';
import { findUserById } from '../../lib/auth/users';
import { logBrandView, logSugargooClick } from '../../lib/db/behaviorEvents';
import { productMatchesBrand } from '../../lib/brandMatch';
import { loadBrands } from '../../lib/brandsData';
import { sendMetaConversionEvent } from '../../lib/metaConversions';

interface TrackingEvent {
  timestamp: string;
  type:
    | 'product-click'
    | 'signup-click'
    | 'page-view'
    | 'brand-view'
    | 'style-quiz-started'
    | 'style-quiz-completed'
    | 'style-quiz-banner-dismissed'
    | 'style-quiz-pick-click';
  productId?: string;
  productName?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  eventId?: string;
}

/** Resolves a brand slug from an explicit brand name (exact) or a product name (heuristic). */
function resolveBrandSlug(brandName?: string, productName?: string): string | null {
  const brands = loadBrands();
  if (brandName) {
    const exact = brands.find((b) => b.brandName.toLowerCase() === brandName.toLowerCase());
    if (exact) return exact.slug;
  }
  if (productName) {
    const match = brands.find((b) => productMatchesBrand(productName, b.brandName));
    if (match) return match.slug;
  }
  return null;
}

/**
 * Mirrors qualifying events into durable, user-scoped Supabase storage for the
 * behavioral email automations (brand nudge). Best-effort and silent for
 * anonymous visitors — email automations need a known recipient, and this
 * must never affect the response to the (much higher-volume) anonymous
 * click-logging this endpoint otherwise handles.
 */
async function mirrorBehaviorEvent(
  req: NextApiRequest,
  type: string,
  body: { brand?: string; productName?: string; productId?: string }
): Promise<void> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return;

  try {
    if (type === 'brand-view') {
      const slug = resolveBrandSlug(body.brand, body.productName);
      if (slug) await logBrandView(userId, slug);
    } else if (type === 'product-click') {
      const slug = resolveBrandSlug(body.brand, body.productName);
      await logSugargooClick(userId, { brandSlug: slug, productId: body.productId ?? null });
    }
  } catch (error) {
    console.error('⚠️ Behavior event mirror failed (non-blocking):', error instanceof Error ? error.message : error);
  }
}

/**
 * Fires the ClickToSugargoo Conversions API event for the click-through
 * trigger logged as `type: 'product-click'`, sharing `eventId` with the
 * Pixel call already fired client-side (see lib/metaPixel.ts) so Meta can
 * dedup the two. Best-effort — a Meta API hiccup must never affect the
 * (much higher-volume) click-logging this endpoint otherwise handles.
 */
async function fireClickToSugargooConversion(
  req: NextApiRequest,
  eventId: string,
  ip: string | undefined,
  url: string | undefined
): Promise<void> {
  try {
    const userId = getUserIdFromRequest(req);
    const user = userId ? await findUserById(userId) : null;

    await sendMetaConversionEvent({
      eventName: 'ClickToSugargoo',
      eventId,
      email: user?.email,
      ip,
      userAgent: req.headers['user-agent'],
      eventSourceUrl: url,
    });
  } catch (error) {
    console.error('⚠️ ClickToSugargoo CAPI event failed (non-blocking):', error instanceof Error ? error.message : error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, productName, type, url, brand, eventId } = req.body;

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
      eventId,
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

    // Awaited directly (not setImmediate) — Vercel freezes the function's
    // execution context as soon as the response is sent, so deferred async
    // work here would silently never complete. See lib/mailerlite.ts for the
    // same reasoning applied to the signup flow.
    await mirrorBehaviorEvent(req, event.type, { brand, productName, productId });

    if (event.type === 'product-click' && eventId) {
      await fireClickToSugargooConversion(req, eventId, event.ip, url);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Tracking failed' });
  }
}
