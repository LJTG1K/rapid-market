-- Backfill pixel_events with pre-tracker history (run in the Supabase SQL editor).
--
-- Copies two existing sources into the ledger as source = 'backfill' rows so the
-- local dashboard's timeline starts at launch instead of at deploy:
--   * behavior_events.sugargoo_click  -> logical_event 'buy_click'
--   * style_quiz_responses            -> logical_event 'quiz_complete'
--
-- Limits (the dashboard labels these as backfilled):
--   * Logged-in users only, and clicks only from pages that reported to /api/track.
--   * One quiz row per user (first completion; retakes overwrite the answers).
--   * No pixel-delivery information exists for this period — these rows carry no
--     browser/server outcome and are excluded from the dashboard's delivery stats.
--
-- Safe to re-run: each row has a stable event_id and is skipped if already copied.
-- Rows are only taken from BEFORE the first real ledger fire (browser/server), so
-- once the tracker is live the same click is never counted from both places —
-- re-running after go-live just fills the gap up to that moment.

with cutoff as (
  select coalesce(
    (select min(created_at) from pixel_events where source in ('browser', 'server')),
    now()
  ) as at
)
insert into pixel_events
  (created_at, event_id, logical_event, platform, platform_event, source, status, product_id, user_id, params)
select
  be.created_at,
  'backfill-click-' || be.id,
  'buy_click', 'none', 'none', 'backfill', 'backfilled',
  be.product_id,
  be.user_id::text,
  jsonb_build_object('origin', 'behavior_events', 'brand_slug', be.brand_slug)
from behavior_events be, cutoff
where be.event_type = 'sugargoo_click'
  and be.created_at < cutoff.at
  and not exists (select 1 from pixel_events p where p.event_id = 'backfill-click-' || be.id);

with cutoff as (
  select coalesce(
    (select min(created_at) from pixel_events where source in ('browser', 'server')),
    now()
  ) as at
)
insert into pixel_events
  (created_at, event_id, logical_event, platform, platform_event, source, status, user_id, params)
select
  q.created_at,
  'backfill-quiz-' || q.id,
  'quiz_complete', 'none', 'none', 'backfill', 'backfilled',
  q.user_id::text,
  jsonb_build_object('origin', 'style_quiz_responses', 'styles', q.styles)
from style_quiz_responses q, cutoff
where q.created_at < cutoff.at
  and not exists (select 1 from pixel_events p where p.event_id = 'backfill-quiz-' || q.id);
