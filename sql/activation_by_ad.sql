-- Activation per ad: for each utm_content, how many people signed up and how
-- many of them went on to click through to Sugargoo (ClickToSugargoo).
-- Requires sql/users_utm_attribution.sql. Read-only; run in the Supabase SQL editor.
--
-- A ClickToSugargoo counts if the user was logged in when they clicked (the
-- session cookie is set at signup, so post-signup clicks are). Every click
-- writes one Meta 'server' ledger row whatever the CAPI outcome (sent or
-- filtered as a bot), so that row is used as "the click happened".
-- Clicks made before signing up are anonymous and can't be linked.

with registrants as (
  select id::text as user_id, utm_content
  from users
  where utm_content is not null
    and utm_campaign = 'rapid_signup_oct26'   -- remove or change to compare campaigns
),
clickers as (
  select distinct user_id
  from pixel_events
  where platform = 'meta'
    and platform_event = 'ClickToSugargoo'
    and source = 'server'
    and user_id is not null
)
select
  r.utm_content,
  count(*) as registrants,
  count(c.user_id) as registrants_with_click,
  round(100.0 * count(c.user_id) / count(*), 1) as click_rate_pct
from registrants r
left join clickers c on c.user_id = r.user_id
group by r.utm_content
order by registrants desc;
