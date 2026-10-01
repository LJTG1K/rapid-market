# Campaign landing pre-launch fixes

Branch `fix/campaign-landing-prelaunch`, from `feature/style-quiz` @ `3fb0158`. Not deployed to production. The migration has **not** been applied.

## What changed, by file

| File | Change |
|---|---|
| `pages/campaign.tsx` | Proof strip: `150+` "Independent brands". Every other 100+ seller count → 150+. Product highlights: logged out (or while auth is loading) the button reads **"Sign up to buy"** → `/signup` with no tracking; logged in it's unchanged (direct Sugargoo link plus `trackBuyClick`). |
| `components/Footer.tsx`, `components/LoadingMessage.tsx`, `pages/_document.tsx` (meta, OG, Twitter, schema), `pages/index.tsx`, `pages/brands/index.tsx`, `pages/tutorial.tsx`, `pages/gillys-picks.tsx` | 100+ sellers → 150+. Gilly's Picks: "thousands of pieces" → "1,500+ pieces". |
| `pages/reddit.tsx` | 2,000+ products → 1,500+ (stat, meta description, body copy). |
| `pages/blog/[slug].tsx` | "Browse thousands of products" → "Browse 1,500+ products". |
| `lib/attribution.ts` | Stores `utmSource` and `utmContent` alongside medium and campaign. |
| `pages/signup.tsx` | Sends all four UTMs to the register API. |
| `pages/api/sugargoo/register.ts`, `lib/auth/users.ts` | `setUserSignupUtmsIfUnset()` writes `users.utm_*` after account creation, only while all four are null, so they're never overwritten. Logs a warning if the columns don't exist yet. |
| `lib/tracking.ts`, `pages/api/pixel-events.ts`, `lib/db/pixelEvents.ts` | `utmContent` goes into `pixel_events.utm_content` and also `params.utm_content`. If the column doesn't exist yet, the insert retries without it, so no ledger rows are lost. |
| `pages/brands/[slug].tsx` | The title size is computed so the widest word fits the screen, capped at the old desktop size. The column gets `min-w-0`, so a long word can't widen the page. |
| `sql/users_utm_attribution.sql` | Migration, **not applied**. |
| `sql/activation_by_ad.sql` | Activation query, **not run**. |

## Fix 1: count/stat search

**The empty "New items indexed daily" value is intentional.** Commit `938fcde` (16 Jul) replaced the "3M+ Products indexed" stat with a label-only card, and `campaign.tsx` has a separate render branch for an empty value. History worth knowing: in July "150+" was changed to "100+" as the *accurate* seller count (`61bcde4`, `0164529`). Your confirmed 150+ supersedes that. `public/data/brands.json` has 170 brand pages.

**Fixed** (line numbers from before the edit):

| File:line | Was | Now |
|---|---|---|
| `pages/campaign.tsx:39` | 100+ Verified sellers | 150+ Independent brands |
| `pages/campaign.tsx:48, 64, 185, 188, 205` | 100+ (Chinese) sellers | 150+ |
| `components/Footer.tsx:34` | 100+ independent Chinese sellers | 150+ |
| `components/LoadingMessage.tsx:9` | Sorting 100+ sellers… | 150+ |
| `pages/_document.tsx:14, 31, 38, 53` | 100+ sellers (meta description, OG, Twitter, schema) | 150+ |
| `pages/index.tsx:69, 114, 142, 191, 218, 243, 281` | 100+ (incl. hero CountUp, meta description) | 150+ |
| `pages/brands/index.tsx:64, 73` | 100+ featured sellers | 150+ |
| `pages/tutorial.tsx:116` | 100+ sellers | 150+ |
| `pages/gillys-picks.tsx:188` | thousands of pieces from 100+ sellers | 1,500+ pieces from 150+ sellers |
| `pages/reddit.tsx:24, 135, 210` | 2,000+ products | 1,500+ |
| `pages/blog/[slug].tsx:135` | thousands of products | 1,500+ products |
| `pages/reddit.tsx:23` | 150+ Sellers indexed | already correct, unchanged |

**Flagged, not changed:**

- **"Sellers" vs "brands" wording.** Only the `/campaign` stat now says "Independent brands". Everywhere else still says "sellers" (now 150+). Whether to switch the noun site-wide is a copy decision.
- **"47,000+ hauls shipped" and "4.8★ / 4.8/5 average rating"** (`campaign.tsx:218, 349`, `index.tsx:218`, `reddit.tsx` stat) are outside the confirmed figures. I couldn't verify them, so I left them.
- **Test pages** `landingpagetest-1/2/3.tsx`, `test/signup.tsx` are publicly reachable and still say 100+. They also carry unverifiable claims: "100+ 5 Star Reviews", "1,000+ verified reviews", "Join 15,234+ buyers this month", "50K+", "Trusted by thousands". I recommend deleting them rather than correcting them.
- **Stale docs** (`README.md` etc.) weren't touched.

## Fix 2: other pages where logged-out users get direct Sugargoo buy links (not changed)

| Page / component | Where |
|---|---|
| `components/ProductCard.tsx:60` ("View →") | Used on `/fashion-listings`, `/tech-listings`, `CategoryShelf`, and `ProductMatchGrid`, i.e. the quiz results on `/reddit`, `/style-quiz` and the fashion-listings quiz picks |
| `pages/product/[id].tsx:218` (Buy on Sugargoo) and `:234` (See full reviews) | product detail |
| `pages/brands/[slug].tsx:188` | brand page product grid |
| `pages/fashion-listings/[slug].tsx:257` | older fashion detail route |
| `pages/gillys-picks.tsx:169` | Gilly's Picks (the retargeting landing page) |
| `pages/reddit.tsx:90` | Reddit landing "random pull" |
| `pages/landingpagetest-1/2/3.tsx` | open Sugargoo's *signup* page with an invite link, not a product |

**Not leaky:** `/account` (logged-in only), and `/signup`'s product picks and "Go to Sugargoo" link, which only appear after a successful signup.

`/signup` has **no return/next parameter**, so "Sign up to buy" goes to plain `/signup` and the product isn't carried through. I didn't build one.

## Fix 3: attribution and persistence

**What the overwrite logic already did** (unchanged): a visit with `utm_source` replaces the whole stored object (last UTM touch wins). A visit without `utm_source` leaves it alone. Path inference (`/campaign` → meta, `/reddit` → reddit) only applies when nothing is stored. That matches what you asked for. One nuance: *any* `utm_source` wins, not just paid ones (e.g. an `utm_source=newsletter` link would replace a Meta touch).

`utm_source` is saved only when it's actually in the URL. A `/campaign` visit without UTMs stores channel `meta` (inferred) but leaves `utm_source` null on the user, so inferred and real ad traffic stay distinguishable.

### Migration: `sql/users_utm_attribution.sql` (not applied)

```sql
alter table users add column if not exists utm_source text;
alter table users add column if not exists utm_medium text;
alter table users add column if not exists utm_campaign text;
alter table users add column if not exists utm_content text;

alter table pixel_events add column if not exists utm_content text;

create index if not exists users_utm_content_idx on users (utm_content) where utm_content is not null;
create index if not exists pixel_events_user_event_idx on pixel_events (user_id, platform_event);
```

It only adds nullable columns and indexes, so it's safe to run while the site is live. **Apply it before the campaign starts.** Until then, signup UTMs are dropped, with a warning in the Vercel logs. Ledger rows keep `utm_content` in `params` either way.

### Activation query: `sql/activation_by_ad.sql` (not run)

```sql
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
```

It counts clicks made while logged in. The session is set at signup, so post-signup clicks count; clicks made *before* signing up are anonymous and can't be linked. The `server` ledger row is used because every click writes one, whether CAPI sent it or the bot filter skipped it.

## Fix 4: retargeting landing pages (report only, nothing broken)

- **Attribution:** tested on `/gillys-picks`: a fresh-UTM landing replaced the stored attribution, and a plain `/tutorial` visit kept it. `/tutorial` uses the same site-wide capture in `_app.tsx`, but I didn't test a fresh-UTM landing on it directly.
- **`/gillys-picks` buy buttons:** one click gives exactly one `ClickToSugargoo`, carrying `utm_content` and `utm_campaign`. The separate `/api/track` post is logging only and doesn't send to Meta.
- **`/tutorial` QualifiedLead:** the code is unchanged. Note how it behaves for retargeting: it only fires for users who **signed up in the last 7 days**, and at most once per 24h per browser. Retargeting older registrants to `/tutorial` will mostly *not* fire QualifiedLead, so don't optimise that campaign on it.
- **`/gillys-picks` gives logged-out visitors direct Sugargoo links** (see Fix 2). Retargeted registrants will usually still be logged in, because sessions last 30 days.

## Fix 5: mobile brand title

Root cause: the title was 60px on mobile, wider than the screen for long single words. The grid column's default `min-width: auto` then let it widen the whole page.

The fix: the title size now comes from per-character widths I measured in the real font, scaled so the widest word fits the screen with 5% to spare, capped at the old 4.5rem. Short names look exactly as before.

Checked all 170 brand names at 320, 360, 375, 390, 414 and 768px: none overflow. On the page at 375px, Heatseeking is 47px and the page width matches the screen. At 320px, Doomsdayvanguard (the longest name) drops to 25px and still fits.

## Verification

- `tsc --noEmit` passes. `next build` passes.
- Tested on a local **production build** forced into preview mode (`VERCEL_ENV=preview`): pixels stubbed, ledger rows logged instead of written, no CAPI sends. Results:
  - `/campaign` logged out: 3× "Sign up to buy" → `/signup`. Clicking one fired **0** ClickToSugargoo and 0 ledger reports.
  - `/campaign` → `/signup` after landing with `SU_Test`: the register payload carried `utmSource: meta`, `utmMedium: paid_social`, `utmCampaign: rapid_signup_oct26`, `utmContent: SU_Test`. The register call was intercepted in the browser, so no account was created.
  - `/campaign` logged in: 3× direct "Buy" links. Two clicks gave exactly 2 ClickToSugargoo events, and the ledger rows had `utm_content: SU_Test`.
  - `/gillys-picks` with retargeting UTMs: one click gave 1 ClickToSugargoo with `utm_content: RT_Picks_A`.
  - Overwrite rules: a plain `/tutorial` visit and an inferred `/reddit` visit kept `SU_Test`; a fresh UTM landing replaced it.
  - Brand titles: see Fix 5.

## Couldn't verify

- **Logged-in state used a stub.** I didn't create a real account (that would make a real Sugargoo account). "Logged in" was simulated in the browser, so ledger rows had `user_id` null and `users.utm_*` writes weren't exercised. `setUserSignupUtmsIfUnset` is type-checked but has never run against the database.
- **The migration and query** weren't run, as instructed.
- **QualifiedLead firing:** this needs a real account that signed up in the last 7 days. The code path is unchanged.
- **Product data was stubbed locally** (no Google Sheets key in `.env.local`). The preview deployment uses the real feed.
- **Dev-server quirk (`npm run dev` only):** any page loaded directly with a query string (e.g. a UTM link) never finished loading, so nothing on it ran. The production build doesn't have the problem, and production clearly captures UTMs (live ledger rows carry `utm_source` channels), but test UTM links with a build, not `npm run dev`. I didn't dig further. There are also Header hydration warnings at phone width in dev, which I didn't touch.

## Steps for you

**(a) Apply the migration**
1. Supabase dashboard → project `rysswaluwvwjlhuiqfsy` → SQL Editor → New query.
2. Paste `sql/users_utm_attribution.sql` and click Run. It's safe to run twice.
3. Check it worked: `select utm_source, utm_medium, utm_campaign, utm_content from users limit 1;` should return the four columns (null).
4. Or tell me "apply it" and I'll run it through the Supabase connector.

**(b) Promote to production**
1. Click through the preview on your phone (URL in my message).
2. Merge: `git checkout feature/style-quiz && git merge --ff-only fix/campaign-landing-prelaunch && git push origin feature/style-quiz`. That only builds a preview.
3. In Vercel → rapid-market → Deployments, open the new `feature/style-quiz` deployment → ⋯ → **Redeploy** → Environment **Production**. Don't use the API "promote" on a preview build: it doesn't rebuild, so production would run with preview env vars and no CAPI tokens. (Last time I did the production redeploy through the API; you can ask me to.)
4. Check: open `https://www.rapid.market/campaign` logged out → "Sign up to buy". In `pixel_events`, new rows should have `utm_content` when the visitor came from an ad.
5. Rollback if needed: Vercel → Deployments → the current production deployment (`dpl_9ksRggnkTyeJD7pvihDDoF54cXJ8`) → Instant Rollback.
