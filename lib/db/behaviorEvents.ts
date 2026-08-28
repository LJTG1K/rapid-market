/**
 * Durable, user-scoped on-site behavior tracking that feeds the behavioral
 * email automations (brand nudge, wishlist digest). Server-only — imports the
 * service-role Supabase client. Unlike lib/db/analytics.ts (SQLite, ephemeral
 * on Vercel, anonymous), this is Postgres and always tied to a logged-in
 * user_id, since email automations need a known recipient.
 */
import { getSupabase } from '../supabase';

export type BehaviorEventType = 'brand_view' | 'sugargoo_click';
export type AutomationKey = 'brand_nudge' | 'wishlist_digest';

export async function logBrandView(userId: string, brandSlug: string): Promise<void> {
  const { error } = await getSupabase()
    .from('behavior_events')
    .insert({ user_id: userId, event_type: 'brand_view', brand_slug: brandSlug });
  if (error) throw error;
}

export async function logSugargooClick(
  userId: string,
  params: { brandSlug?: string | null; productId?: string | null }
): Promise<void> {
  const { error } = await getSupabase()
    .from('behavior_events')
    .insert({
      user_id: userId,
      event_type: 'sugargoo_click',
      brand_slug: params.brandSlug ?? null,
      product_id: params.productId ?? null,
    });
  if (error) throw error;
}

export interface StaleBrandView {
  userId: string;
  brandSlug: string;
  viewedAt: string;
}

/**
 * Brand views from >= 24h ago with no later sugargoo_click for that same
 * user+brand, throttled to at most one per user per `periodKey` (e.g. one
 * ISO-week key) so a user who browsed five brands without buying gets one
 * nudge, not five — the oldest (most overdue) qualifying brand wins. A user
 * already nudged this period is skipped entirely, regardless of how many
 * other brands they've since left stale.
 */
export async function findStaleBrandViews(periodKey: string): Promise<StaleBrandView[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const supabase = getSupabase();

  const { data: views, error } = await supabase
    .from('behavior_events')
    .select('user_id, brand_slug, created_at')
    .eq('event_type', 'brand_view')
    .lte('created_at', cutoff)
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!views || views.length === 0) return [];

  // Dedupe to the oldest view per (user, brand) — later re-views of the same
  // brand before it's been nudged shouldn't create duplicate candidates.
  const byPair = new Map<string, { userId: string; brandSlug: string; viewedAt: string }>();
  for (const v of views as any[]) {
    if (!v.brand_slug) continue;
    const key = `${v.user_id}:${v.brand_slug}`;
    if (!byPair.has(key)) {
      byPair.set(key, { userId: v.user_id, brandSlug: v.brand_slug, viewedAt: v.created_at });
    }
  }

  const pairCandidates = Array.from(byPair.values());
  if (pairCandidates.length === 0) return [];

  const userIds = Array.from(new Set(pairCandidates.map((c) => c.userId)));

  const [{ data: clicks, error: clicksError }, { data: triggered, error: triggeredError }] = await Promise.all([
    supabase
      .from('behavior_events')
      .select('user_id, brand_slug, created_at')
      .eq('event_type', 'sugargoo_click')
      .in('user_id', userIds),
    supabase
      .from('automation_triggers')
      .select('user_id')
      .eq('automation_key', 'brand_nudge')
      .eq('dedupe_key', periodKey)
      .in('user_id', userIds),
  ]);
  if (clicksError) throw clicksError;
  if (triggeredError) throw triggeredError;

  const alreadyNudgedThisPeriod = new Set((triggered as any[]).map((t) => t.user_id));

  const eligiblePairs = pairCandidates.filter((c) => {
    if (alreadyNudgedThisPeriod.has(c.userId)) return false;

    const hasLaterClick = (clicks as any[]).some(
      (click) =>
        click.user_id === c.userId &&
        click.brand_slug === c.brandSlug &&
        click.created_at >= c.viewedAt
    );
    return !hasLaterClick;
  });

  // Collapse to one (the oldest/most overdue) qualifying brand per user.
  const byUser = new Map<string, StaleBrandView>();
  for (const c of eligiblePairs) {
    const existing = byUser.get(c.userId);
    if (!existing || c.viewedAt < existing.viewedAt) {
      byUser.set(c.userId, c);
    }
  }

  return Array.from(byUser.values());
}

export async function markTriggered(
  userId: string,
  automationKey: AutomationKey,
  dedupeKey: string
): Promise<void> {
  const { error } = await getSupabase()
    .from('automation_triggers')
    .upsert(
      { user_id: userId, automation_key: automationKey, dedupe_key: dedupeKey },
      { onConflict: 'user_id,automation_key,dedupe_key', ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function hasTriggered(
  userId: string,
  automationKey: AutomationKey,
  dedupeKey: string
): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('automation_triggers')
    .select('id')
    .eq('user_id', userId)
    .eq('automation_key', automationKey)
    .eq('dedupe_key', dedupeKey)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
