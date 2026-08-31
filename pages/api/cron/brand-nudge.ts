/**
 * "Clicked a brand, never clicked through to Sugargoo" behavioral nudge.
 * Runs hourly (see vercel.json). For each brand view >= 24h old with no later
 * Sugargoo click for that brand, stages merge fields on the MailerLite
 * subscriber and adds them to the group that triggers the brand-nudge
 * automation (subscriber_joins_group), then marks it triggered so reruns
 * don't double-fire. Throttled to at most one nudge per user per calendar
 * week (lib/periodKey.ts) — a user who left several brands stale gets one
 * email for the oldest/most-overdue brand, not one per brand. See
 * lib/db/behaviorEvents.ts for the query logic.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { isAuthorizedCronRequest } from '../../../lib/cronAuth';
import { findStaleBrandViews, markTriggered } from '../../../lib/db/behaviorEvents';
import { findUserById } from '../../../lib/auth/users';
import { upsertSubscriberFields, addSubscriberToGroup } from '../../../lib/mailerlite';
import { loadBrands } from '../../../lib/brandsData';
import { productMatchesBrand } from '../../../lib/brandMatch';
import { isoWeekKey } from '../../../lib/periodKey';
import { getSiteBaseUrl } from '../../../lib/siteUrl';

interface Product {
  name: string;
  image: string;
}

/** Brand pages (pages/brands/[slug].tsx) only ever show the fashion catalog — mirrored here. */
async function fetchFashionProducts(req: NextApiRequest): Promise<Product[]> {
  const response = await fetch(`${getSiteBaseUrl(req)}/api/products?category=fashion`);
  if (!response.ok) return [];
  return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorizedCronRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const groupId = process.env.MAILERLITE_BRAND_NUDGE_GROUP_ID;
  if (!groupId) {
    console.error('⚠️ MAILERLITE_BRAND_NUDGE_GROUP_ID not configured — skipping brand-nudge cron');
    return res.status(200).json({ processed: 0, skipped: 'not configured' });
  }

  const brands = loadBrands();
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  const weekKey = isoWeekKey(new Date());

  let processed = 0;
  let failed = 0;

  try {
    const [staleViews, products] = await Promise.all([findStaleBrandViews(weekKey), fetchFashionProducts(req)]);

    for (const view of staleViews) {
      try {
        const brand = brandBySlug.get(view.brandSlug);
        const user = await findUserById(view.userId);
        if (!brand || !user) {
          failed++;
          continue;
        }

        const heroProduct = products.find((p) => productMatchesBrand(p.name, brand.brandName));

        await upsertSubscriberFields(user.email, {
          last_browsed_brand: brand.brandName,
          last_browsed_brand_url: `https://rapid.market/brands/${brand.slug}`,
          last_browsed_brand_image: heroProduct?.image ?? '',
        });
        const added = await addSubscriberToGroup(user.email, groupId);
        if (!added) {
          failed++;
          continue;
        }

        await markTriggered(view.userId, 'brand_nudge', weekKey);
        processed++;
      } catch (itemError) {
        // One user's failure shouldn't abort the batch.
        console.error('⚠️ brand-nudge item failed:', itemError instanceof Error ? itemError.message : itemError);
        failed++;
      }
    }

    return res.status(200).json({ processed, failed, candidates: staleViews.length });
  } catch (error) {
    console.error('❌ brand-nudge cron failed:', error);
    return res.status(500).json({ error: 'Cron failed' });
  }
}
