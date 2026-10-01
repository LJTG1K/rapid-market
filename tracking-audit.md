# Meta tracking audit: rapid.market

Audit date: 1 Oct 2026. Pixel 951122617742977. Data window: 4–30 Sept 2026 (UTC).
Investigation only. Nothing was deployed or changed in production. Fixes are local commits on `fix/meta-tracking-dedup` (branched from `feature/style-quiz`, which is what Vercel deploys to production). The branch is **not pushed**, because a push would trigger a Vercel preview build.

## TL;DR

**Is ClickToSugargoo safe to optimise on right now? No. It will be after fix 1 (bot / no-browser-signal gate on CAPI) is deployed and a few days of clean data have built up.**

- **There is no double counting.** Your pairs aren't browser vs server. The first number is **all events received** (browser + server) and the second is **browser only**. Dedup is correctly wired (same `eventID`/`event_id`, identical event names, server sent within ~1s), so Meta collapses the pairs.
- **The 2:1 ratio on ClickToSugargoo means browser events are missing, not extra.** Every real click reaches Meta through CAPI, but only about half reach it through the browser pixel. Since 21 Sept: 1,243 buy clicks, 1,243 CAPI successes, 611 browser pixel fires.
- **The real problem is what's in those clicks.** Only **34.9%** of ClickToSugargoo events carry Meta's `_fbp` browser cookie. Every other event on the pixel is at 100%. About two-thirds of ClickToSugargoo events come from clients where Meta's pixel never ran, and they cluster in anonymous, unattributed traffic. A crawler is visibly working through the site right now. CAPI forwards all of it to Meta, so a campaign optimising on ClickToSugargoo would learn from this traffic.
- **CAPI was off until 14 Sept.** `META_CONVERSIONS_API_TOKEN` was added to Vercel on 14 Sept at 06:21 UTC. From 4–13 Sept there were no server events, which is why the two numbers match exactly on those days.
- **The 15–17 Sept spike was the Reddit Stage 1 campaign, not a viral post or Meta ads.** Reddit Ads Manager reports **11,999 clicks** in that window. That's ~1.7 page loads per click against the ~20,600 browser PageViews Meta saw. The traffic was almost entirely Android, came in on a daily schedule and produced ~16 signups, so the quality was very poor (possibly invalid clicks). It also fed the Meta pixel.

---

## Problem 1: duplicate counting

### What your number pairs actually are

I pulled the same stats from Meta's dataset API and reproduced your pairs exactly. The larger number comes from a "server" query and the smaller from a "web" query. But the "server" figure **can't be server-only**: it includes 60,458 PageViews, 1,080 CompleteRegistrations and 1,394 InitiateCheckouts, and **nothing in this codebase sends those three server-side**. When I checked it against our own ledger (`pixel_events` in Supabase), the larger number tracks *CAPI + browser*:

| Day (UTC) | Meta "big" | Ledger CAPI + browser sent | Meta "small" | Ledger browser sent |
|---|---|---|---|---|
| 21 Sept | 270 | 173 + 99 = 272 | 96 | 99 |
| 23 Sept | 85 | 60 + 29 = 89 | 28 | 29 |
| 24 Sept | 167 | 103 + 68 = 171 | 67 | 68 |
| 30 Sept | 245 | 192 + 67 = 259 | 55 | 67 |

So **big = total received, small = browser**. Meta's own `event_source` breakdown gives a third, inconsistent set of numbers (3,125 SERVER / 1,601 BROWSER for ClickToSugargoo, and 56,675 "SERVER" PageViews). I wouldn't trust its source labels. Use the ledger: `npm run dashboard`.

### 1. Where each event fires

No Google Tag Manager container (only GA4 `gtag`), no Webflow and no other tag manager anywhere in the repo or in the pixel's host list. Every event comes from this Next.js app (pages router, Vercel). Line numbers are from `feature/style-quiz` @ `fcffc83`.

| Event | Source | File:line | Trigger |
|---|---|---|---|
| PageView | browser | `pages/_document.tsx:93` | Full page load only. Client-side route changes don't fire it. |
| PageView | browser | `pages/_document.tsx:103` | `<noscript>` image fallback |
| ClickToSugargoo | browser | `lib/metaPixel.ts:31`, via `lib/tracking.ts:62` (`trackBuyClick`) | `onClick` on Sugargoo exit links: `components/ProductCard.tsx:68`, `pages/product/[id].tsx:221`, `pages/brands/[slug].tsx:191`, `pages/fashion-listings/[slug].tsx:260`, `pages/gillys-picks.tsx:172`, `pages/campaign.tsx:141`, `pages/reddit.tsx:93`, `pages/account.tsx:185`, `pages/signup.tsx:81`, `pages/signup.tsx:273` |
| ClickToSugargoo | server (CAPI) | `pages/api/pixel-events.ts:111` | Keepalive POST from `trackBuyClick`, since 21 Sept. From 4–20 Sept it was `pages/api/track.ts` (only 3 pages fired it then) |
| QuizComplete | browser + server | `lib/tracking.ts:108` → same two paths | `components/StyleQuizSection.tsx:72` (on /reddit, /signup, /account), `pages/style-quiz.tsx:65`. **Only since 21 Sept.** |
| QualifiedLead | server | `pages/api/qualified-lead.ts:58` | /tutorial load by a user who signed up in the last 7 days. Cookie-limited to once per 24h. |
| QualifiedLead | browser | `pages/tutorial.tsx:69` | After the API says qualified, with the server's eventId |
| InitiateCheckout | browser only | `pages/signup.tsx:133` | **Every signup-form submit, before the result is known** |
| InitiateCheckout | browser only | `pages/test/signup.tsx:36` | Same, on the test page |
| CompleteRegistration | browser only | `pages/signup.tsx:166` | Sugargoo account created successfully |
| CompleteRegistration | browser only | `pages/test/signup.tsx:68` | Same, on the test page |
| CompleteRegistration | browser only | `pages/landingpagetest-1.tsx:16`, `-2.tsx:48`, `-3.tsx:58` | **Wrong: fires on a click out to Sugargoo's signup page, before any registration** |
| any name | server | `pages/api/meta-conversions.ts:43` | **Open relay: any caller can POST any event name to the production pixel.** No live callers. |
| SubscribedButtonClick | browser | none (Meta automatic events) | Meta auto-detects button clicks. Harmless, but you can turn it off in Events Manager. |

### 2. Deduplication check

| Check | ClickToSugargoo / QuizComplete (since 21 Sept) | Before 21 Sept (`/api/track`) |
|---|---|---|
| One ID per action | ✅ `crypto.randomUUID()` per `trackBuyClick` call | ✅ |
| Browser sends `eventID` (4th arg) | ✅ `fbq('trackCustom', name, params, { eventID })` | ✅ |
| CAPI sends the same `event_id` | ✅ | ✅ |
| Event names identical | ✅ both from `planEvents()` in `lib/pixelEvents.ts` | ✅ |
| Within Meta's 48h dedup window | ✅ CAPI is sent in the same request, ~1s later | ✅ |
| `action_source` | ✅ `website` | ✅ |
| `event_source_url` | ❌ **always `https://rapid.market` (the homepage)**. `ownPageUrl()` compares `www.rapid.market` against the apex host, which never matches. Fixed in fix 1. | ❌ never sent, so it defaulted to the homepage |
| `fbp` / `fbc` | ✅ read from cookies, but only 34.9% / 6.3% coverage (see the TL;DR) | ❌ not sent |
| Hashed `em` | Only for logged-in users (2.6% coverage) | Same |
| `client_ip_address`, `client_user_agent` | ✅ | ✅ |
| `external_id` | ❌ not sent (optional) | ❌ |

Meta's Event Match Quality: ClickToSugargoo 5.3, QuizComplete 6.2, QualifiedLead 6.1, CompleteRegistration 8.3.

### 3. Can ClickToSugargoo fire more than once per click?

**No.** Checked in the code and confirmed in the data:

- One `onClick` per link. No `mousedown`, `pointerdown` or `auxclick` handlers. No handler on a parent element that also fires.
- `ProductCard` fires once. `ProductMatchGrid`'s `onBuyClick` only logs to `/api/track` and doesn't call `trackBuyClick` again.
- No firing from effects, on page load or on route change. React strict mode only double-runs effects in dev, never click handlers.
- Ledger: **0 of 1,248** CAPI clicks happened within 2s of another click on the same product and page. QuizComplete: 0 of 436 within 3s.
- Middle-click and "open in new tab" from a long-press or right-click **don't** fire. That's an undercount, not double counting. Cmd/Ctrl-click does fire, once.
- Also an undercount: the product page's second Sugargoo link ("See full reviews on Sugargoo →", `pages/product/[id].tsx:~230`) had no tracking. Fixed in fix 4.

### 4. InitiateCheckout vs CompleteRegistration

InitiateCheckout **is** firing on sign-up, by design rather than by mistake. It fires when the signup form is *submitted* (`pages/signup.tsx:133`), and CompleteRegistration fires a second or two later when the account is confirmed (`:166`). That's why the hourly counts move together. Over the window it was 1,387 vs 1,076, so about 22% of submits fail (duplicate email, bad format and so on).

RAPID has no checkout, so on this site **InitiateCheckout means "submitted the signup form"**, including the ~22% of submits that fail. **Decision (1 Oct): keep the name unchanged**, because live ads are set up on InitiateCheckout. Anyone reading those campaigns should know a "checkout" there is a signup attempt, and that it counts failed attempts.

CompleteRegistration looks trustworthy. Meta's browser count (1,076) is about 93% of Supabase signups over the same days (1,154), and the gap fits ad blockers. The `landingpagetest-*` misfires were small and are fixed in fix 3.

### 5. Why the ~2:1 ratio

- **4–13 Sept:** total equals browser (e.g. 7 Sept: 86/86) because **CAPI wasn't configured**. The Vercel env var `META_CONVERSIONS_API_TOKEN` was created at 2026-09-14 06:21 UTC. QualifiedLead's server events were missing for the same reason.
- **QuizComplete (21–30 Sept):** 423 completions, 423 CAPI successes, 347 browser fires (82%). Total ≈ server + browser ≈ 2×. That's **expected**, and dedup works on it.
- **ClickToSugargoo:** total ≈ server (every click) + browser (only ~half). In the ledger, 632 of 1,243 browser fires were `queued`: `fbq` existed, but Meta's script had never loaded at click time, and those events never arrived. The `queued` rate is **58%** for anonymous, unattributed visitors on `/product/[id]` and 53% on `/brands/[slug]`. It's **5–25%** for visitors attributed to Reddit or Instagram. That gap, and the 34.9% `fbp` coverage, point to a large share of ClickToSugargoo coming from automated clients, not people.

**Verdict:** no double-firing and no broken dedup. One source (browser) is missing events. The bigger issue is that the source that *isn't* missing (CAPI) is sending junk.

Rough deduplicated ClickToSugargoo total for 4–30 Sept: about 2,600 (617 browser-only events from 4–13 Sept, plus about 2,000 server-sourced events from 14–30 Sept). This is an estimate.

### 6. `__missing_event`

There were 2 events (5 Sept and 15 Sept), both arriving through the browser channel, and Meta records **no host and no device** for either. Nothing in the code calls `fbq` without a name, and every call site uses a hardcoded name. They almost certainly came from a direct request to `facebook.com/tr?id=951122617742977` without an `ev` parameter (the pixel ID is public in the page source), for example a scanner. They're harmless. Turning on traffic permissions (see "Other findings" below) limits which domains can send events.

---

## Problem 2: traffic spike, 15–17 Sept

### What the data shows

Window: 15 Sept 07:00 UTC to 17 Sept 14:00 UTC (55 hours) compared with every other hour from 4–30 Sept (Meta browser data):

| | Spike, per hour | Rest of month, per hour |
|---|---|---|
| PageView | 375 | 63 |
| Android phone events | **736** | 57 (13×) |
| iPhone events | **15** | 51 (*fell*) |
| Desktop events | 27 | 26 (flat) |
| CompleteRegistration | 0.3 | 1.8 |
| InitiateCheckout | 0.7 | 2.3 |
| ClickToSugargoo, browser | 3.7 | 2.7 |
| ClickToSugargoo, total | ~9 | ~4 |

- **Shape:** each day it comes on around 01:00–07:00 UTC (09:00–15:00 Perth), peaks at 1,200–1,400 browser PageViews an hour, and stops around 14:00–15:00 UTC. It repeated for three days, then ended abruptly on 17 Sept at 14:00 UTC. Your figure of 1,000–2,800 an hour is higher than the browser peak I see (max 1,372); your source may count differently.
- **Host:** `www.rapid.market`. Not preview URLs or a copy of the site.
- **Vercel runtime logs** (16 Sept 08:00–10:00 UTC vs the same hours on 19 Sept): `/api/products` 1,944 vs 55, `/api/auth/me` 1,558 vs 26. These are full page loads running JavaScript; that's why they fire the browser PageView.
- **Reddit:** Reddit CAPI calls in that sample nearly all logged `click_id present`, meaning those visitors carried a Reddit ad click ID.
- **Sign-ups (Supabase `users`):** 16 across the whole spike, vs 79–125 a day from 1–14 Sept. But it's confounded: **Meta ad spend ended 15 Sept** (A$45 that day and nothing after; A$77–109 a day before), and signups have stayed at 1–5 a day ever since. The signup drop is the ads stopping, not the spike.
- **Meta ads were not the source:** spend had stopped.

### Verdict: Reddit paid traffic

- **Source: the Reddit Stage 1 campaign** (live from 15 Sept, commit `92811bc`). Reddit Ads Manager reports **11,999 clicks** over the spike window. Meta saw ~20,600 browser PageViews in the same 55 hours, about 1.7 page loads per click. Reddit click IDs appear on the spike's CAPI events. Reddit doesn't give hourly figures here, so the daily on/off shape is most likely the campaign's daily budget pacing.
- **Quality was very poor.** About 12k clicks led to ~16 signups (~0.13%), the traffic was Android-only, and iPhone traffic fell. That's a pattern seen with in-app or off-platform placements and invalid clicks. Worth raising with Reddit for an invalid-traffic review or credit, and checking the campaign's placements and device targeting before running it again.
- **Not a viral organic post, not a referral link, and not Meta ads** (Meta spend had stopped).
- **It polluted the Meta pixel.** Those visitors fired Meta PageView and some ClickToSugargoo. Fix 1 doesn't filter them, because they're real browsers. Meta's optimisation for the new campaign will partly have learned from this traffic.
- **Separately, bots are active now.** In the current deployment's last 24h, brand pages were fetched in near-alphabetical order (`1am` 433, `54a0` 384, `99club` 313, `aberdeen` 259, then a smooth decline across 355 paths). The homepage-featured brand (Gray Dreams) isn't in the top 25. People don't browse like that.

### Stopping bot traffic reaching the pixel and CAPI

1. **CAPI-side check (implemented, fix 1).** Skip CAPI for bot user agents. For Meta, also skip when the request has no `_fbp` or `_fbc` cookie and no logged-in user. Skips are written to the ledger with a reason and the user agent, so the filter can be checked and tuned.
2. **Browser-side check (implemented, fix 1).** Don't fire pixels when `navigator.webdriver` is set or the user agent says headless or bot.
3. **Vercel Firewall (not applied; your call).** Turn on the managed Bot Protection ruleset in Challenge mode. Add a rate limit on `/api/pixel-events` and `/api/track` (e.g. 30 requests a minute per IP). Deny requests to those two paths with an empty user agent.
4. **Meta Events Manager.** Turn on **traffic permissions** with an allowlist of `rapid.market` and `www.rapid.market`. Events currently also arrive from `localhost` (84) and about a dozen `*.vercel.app` preview URLs (~70). Also exclude Audience Network from the new campaign.

---

## Proposed fixes (`fix/meta-tracking-dedup`, ranked by impact)

| # | Commit | What it does | Risk |
|---|---|---|---|
| 1 | `af73f90` Keep bot and pixel-less traffic out of Meta/Reddit conversion events | `lib/botFilter.ts` (new), `lib/tracking.ts`, `pages/api/pixel-events.ts`, `pages/_document.tsx`. Bot user-agent and webdriver check on both sides. Meta CAPI requires `_fbp`, `_fbc` or a logged-in user. Fixes `event_source_url` (www vs apex). Puts the user agent and `has_fbp` in the ledger. | **ClickToSugargoo volume reported to Meta will drop by roughly half.** That drop is the junk leaving, but it also drops some real ad-blocked visitors. |
| 2 | `b05ab04` Remove the open /api/meta-conversions relay | Deletes an endpoint that sent any event name to the production pixel. | None in the repo. Anything external still posting to it would start getting 404s (no evidence of any). |
| 3 | `0ae1f7d` Stop test landing pages firing CompleteRegistration on a link click | `landingpagetest-1/2/3` | Those test pages stop reporting a (wrong) Meta conversion. Reddit `Lead` is unchanged. |
| 4 | `f159c1c` Track the product page's "See full reviews on Sugargoo" exit | Adds `onClick={trackClick}` | Slightly more ClickToSugargoo from real clicks. |
| 5 | `80ee5cf` Make local and preview runs unable to reach the live pixels or ledger | Meta CAPI is live only on the production deployment; elsewhere it uses Test Events (`META_TEST_EVENT_CODE`) or is skipped. Browser pixels are logging stubs off rapid.market. The ledger is console-logged outside production. | If Vercel ever stopped exposing `VERCEL_ENV`, previews would behave as before (live). Production can't lose CAPI from this change. Local `next start` (the `rapid-prod` launch config) still counts as live. |

Type-check (`tsc --noEmit`) passes. The bot filter was checked against Android Chrome, iOS Instagram, the Reddit Android webview and the TikTok webview (all kept as human) and against HeadlessChrome, Googlebot, facebookexternalhit, python-requests and an empty user agent (all flagged).

**Verified locally (1 Oct), with nothing sent to Meta, Reddit or the production ledger:**

- On localhost, the Meta and Reddit scripts don't load. PageView, PageVisit and every event call go to `window.__pixelLog`.
- Clicking "Buy on Sugargoo" and "See full reviews on Sugargoo" on a product page gave exactly **one** ClickToSugargoo each. Each had its own event ID, and the pixel's `eventID` matched the ID sent to `/api/pixel-events`.
- The server gate (rows console-logged, not written) behaves as follows:

  | Request | Meta CAPI | Reddit CAPI |
  |---|---|---|
  | Googlebot UA | skipped `bot-ua` | skipped `bot-ua` |
  | Browser flagged as bot | skipped `bot-browser` | skipped `bot-browser` |
  | Real UA, no `_fbp` | skipped `no-browser-signal` | skipped `non-production` |
  | Real UA + `_fbp` | passes the gate, then `non-production` (where Test Events takes over) | skipped `non-production` |
  | Unknown event name | 400 | — |
  | `POST /api/meta-conversions` | 404 (removed) | — |

**Still to do: the Test Events run.** It needs `META_CONVERSIONS_API_TOKEN` and `META_TEST_EVENT_CODE` in `.env.local`. This tests the server half (payload, `event_source_url`, `fbp`, `event_id`) in Events Manager. Seeing browser + server dedup *together* in Test Events would need the branch running on a real rapid.market host, which means a deploy.

**After fix 1 is live:** watch the ledger for 3–5 days. If real-looking clicks (attributed channels, logged-in users) show up as `no-browser-signal`, loosen the gate. Then launch the campaign.

## Other findings

- **Graph API `v18.0`** in `lib/metaConversions.ts` is well past its normal lifetime. It's still returning success today (every ledger row is `success`), but bump it before Meta turns it off.
- **`/api/pixel-events` is public.** It only accepts the two named events, which is good, but a script can still post fake buy clicks with a made-up `eventId`. Fix 1's gate plus a firewall rate limit cover most of this.
- **`robots.txt`** points its sitemap at `rapid-five-zeta.vercel.app`, an old host.
- **`/test/signup`** is a public page that creates real Sugargoo accounts and fires InitiateCheckout/CompleteRegistration. Consider deleting it or putting it behind auth.
- The old docs (`SIGNUP_FLOW.md`, `README.md`, `PROJECT_SUMMARY.md`) describe InitiateCheckout as "form shown". It actually fires on submit.

## What I couldn't check, and the access I'd need

| Gap | Why | What would close it |
|---|---|---|
| User agents, IPs/networks, countries, referrers, UTMs and session length for the spike | Vercel Web Analytics isn't enabled (API returns 404). Runtime logs don't record these fields for page requests, and most wider log queries timed out. | **GA4 property G-2EKT9VWVPS** (read access, or an export of 15–17 Sept by source/medium, country, device and engagement time). This is the best single source. Alternatively Vercel Firewall/Observability Plus traffic logs. |
| Hourly Reddit clicks for the spike | Reddit doesn't report it here (total for the window: 11,999) | Reddit's placement, device and invalid-traffic reports for the Stage 1 campaign |
| Meta's deduplicated ClickToSugargoo count | The API exposes received counts only, and its source split is inconsistent | Events Manager → ClickToSugargoo → Overview (it shows deduplicated events and "events deduplicated") |
| Test Events run | OK given 1 Oct; waiting on the token and test code in `.env.local` | Add `META_CONVERSIONS_API_TOKEN` and `META_TEST_EVENT_CODE` to `.env.local` |
| Signup channel attribution in the spike | `channel` and `landingPath` are only logged to the local SQLite analytics DB, not to Supabase `users` | Add the channel to the `users` row, or read the production analytics log |
