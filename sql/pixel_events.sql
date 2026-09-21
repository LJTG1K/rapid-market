-- Pixel-event ledger (lib/db/pixelEvents.ts, pages/api/pixel-events.ts,
-- /admin/pixel-events). One row per platform event per source, so a single
-- buy click writes e.g. a browser row and a server (CAPI) row for each of
-- Meta ClickToSugargoo, Reddit AddToCart and Reddit SugargooBuyClick, all
-- sharing one event_id. Run once in the Supabase SQL editor.

create table if not exists pixel_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),

  event_id text not null,            -- shared pixel/CAPI dedup id
  logical_event text not null,       -- 'buy_click' | 'quiz_complete'
  platform text not null,            -- 'meta' | 'reddit'
  platform_event text not null,      -- name actually sent, e.g. 'ClickToSugargoo'
  source text not null,              -- 'browser' | 'server'
  status text not null,              -- browser: sent|queued|missing|error  server: success|error|skipped
  error text,

  page_path text,                    -- Next route pattern, e.g. '/product/[id]'
  channel text,                      -- attribution channel (reddit / meta / organic ...)
  utm_medium text,
  utm_campaign text,
  product_id text,
  user_id text,
  params jsonb                       -- styles, context, product_name
);

create index if not exists pixel_events_created_at_idx on pixel_events (created_at desc);
create index if not exists pixel_events_event_id_idx on pixel_events (event_id);

-- Only ever accessed server-side via the service-role key (which bypasses
-- RLS); enabling RLS with no policies keeps the anon key out entirely.
alter table pixel_events enable row level security;
