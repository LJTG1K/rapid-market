-- Per-ad attribution for signups and the pixel-event ledger.
--
-- users.utm_*: the UTMs a visitor carried when they signed up (last UTM touch
-- before signup, from lib/attribution.ts). Written once by
-- setUserSignupUtmsIfUnset() in lib/auth/users.ts — only while all four are
-- null — and never overwritten. Users who signed up before this migration,
-- or without any UTMs, stay null.
--
-- pixel_events.utm_content: the ad name (utm_content) on each buy click /
-- quiz completion. Before this column exists the app still writes it into
-- pixel_events.params->>'utm_content'.
--
-- Additive and nullable only: safe to run while the site is live, and the
-- code works with or without it. Run once in the Supabase SQL editor.

alter table users add column if not exists utm_source text;
alter table users add column if not exists utm_medium text;
alter table users add column if not exists utm_campaign text;
alter table users add column if not exists utm_content text;

alter table pixel_events add column if not exists utm_content text;

create index if not exists users_utm_content_idx on users (utm_content) where utm_content is not null;
create index if not exists pixel_events_user_event_idx on pixel_events (user_id, platform_event);
