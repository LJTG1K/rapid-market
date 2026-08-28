/**
 * "Similar to your wishlist" digest. For each user with saved items, picks up
 * to 4 similar products (lib/wishlistDigest.ts) from other brands sharing
 * aesthetic tags, stages them as MailerLite merge fields, and adds the
 * subscriber to the group that triggers the wishlist-digest automation.
 * Deduped to once per user per fortnight (lib/periodKey.ts) via
 * automation_triggers, independent of how often this cron actually runs (see
 * vercel.json) — a fixed cron schedule for "every 2 weeks" isn't reliably
 * expressible, so the throttle lives in the dedupe key instead.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { isAuthorizedCronRequest } from '../../../lib/cronAuth';
import { hasTriggered, markTriggered } from '../../../lib/db/behaviorEvents';
import { findUserById, getUsersWithWishlistItems, getWishlist } from '../../../lib/auth/users';
import { upsertSubscriberFields, addSubscriberToGroup } from '../../../lib/mailerlite';
import { loadBrands } from '../../../lib/brandsData';
import { pickSimilarProducts, type DigestProduct } from '../../../lib/wishlistDigest';
import { isoBiweekKey } from '../../../lib/periodKey';

async function fetchProducts(req: NextApiRequest, category: 'fashion' | 'tech'): Promise<DigestProduct[]> {
  const protocol = req.headers.host?.includes('localhost') ? 'http' : 'https';
  const res = await fetch(`${protocol}://${req.headers.host}/api/products?category=${category}`);
  if (!res.ok) return [];
  return res.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorizedCronRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const groupId = process.env.MAILERLITE_WISHLIST_DIGEST_GROUP_ID;
  if (!groupId) {
    console.error('⚠️ MAILERLITE_WISHLIST_DIGEST_GROUP_ID not configured — skipping wishlist-digest cron');
    return res.status(200).json({ processed: 0, skipped: 'not configured' });
  }

  const periodKey = isoBiweekKey(new Date());
  const brands = loadBrands();

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const [fashionProducts, techProducts, userIds] = await Promise.all([
      fetchProducts(req, 'fashion'),
      fetchProducts(req, 'tech'),
      getUsersWithWishlistItems(),
    ]);
    const productsByCategory: Record<string, DigestProduct[]> = { fashion: fashionProducts, tech: techProducts };

    for (const userId of userIds) {
      try {
        if (await hasTriggered(userId, 'wishlist_digest', periodKey)) {
          skipped++;
          continue;
        }

        const wishlist = await getWishlist(userId);
        if (wishlist.length === 0) {
          skipped++;
          continue;
        }

        // Wishlisted items can span both catalogs; score each catalog against
        // the wishlist items that belong to it and merge the results.
        const byCatalog = new Map<string, typeof wishlist>();
        for (const item of wishlist) {
          const list = byCatalog.get(item.category) ?? [];
          list.push(item);
          byCatalog.set(item.category, list);
        }

        const picks: DigestProduct[] = [];
        for (const [category, items] of byCatalog) {
          const catalog = productsByCategory[category];
          if (!catalog) continue;
          picks.push(...pickSimilarProducts(items, catalog, brands, 4 - picks.length));
          if (picks.length >= 4) break;
        }

        if (picks.length === 0) {
          skipped++;
          continue;
        }

        const user = await findUserById(userId);
        if (!user) {
          failed++;
          continue;
        }

        // Always write all 4 slots (blank for unfilled ones) so a period with
        // fewer than 4 matches doesn't leave a previous period's stale pick behind.
        const fields: Record<string, string> = {};
        for (let i = 0; i < 4; i++) {
          const p = picks[i];
          fields[`wishlist_pick_${i + 1}_name`] = p?.name ?? '';
          fields[`wishlist_pick_${i + 1}_url`] = p?.sugargooLink ?? '';
          fields[`wishlist_pick_${i + 1}_image`] = p?.image ?? '';
        }

        await upsertSubscriberFields(user.email, fields);
        const added = await addSubscriberToGroup(user.email, groupId);
        if (!added) {
          failed++;
          continue;
        }

        await markTriggered(userId, 'wishlist_digest', periodKey);
        processed++;
      } catch (itemError) {
        console.error('⚠️ wishlist-digest item failed:', itemError instanceof Error ? itemError.message : itemError);
        failed++;
      }
    }

    return res.status(200).json({ processed, skipped, failed, candidates: userIds.length });
  } catch (error) {
    console.error('❌ wishlist-digest cron failed:', error);
    return res.status(500).json({ error: 'Cron failed' });
  }
}
