# RAPID — Agent Handoff

A general orientation for any AI agent picking up work on this codebase. Keep this high-level; when you need specifics, read the actual code — it's the source of truth, not this file or the older docs listed at the bottom.

## What RAPID is

RAPID is a marketing/discovery front-end and instant-signup funnel for **Sugargoo**, a Chinese-seller consolidation/agent-shopping service (browse many independent sellers, Sugargoo warehouses and ships everything as one parcel). RAPID does **not** host real commerce — no cart, no checkout, no payments. It indexes products, gets visitors a real Sugargoo account instantly, and every "Buy" link deep-links out to Sugargoo's own site, where the actual purchase happens.

## Core user flows

- **Browse** — product grids (Fashion, Tech, curated "Gilly's Picks", brand pages) sourced from a Google Sheet via `/api/products`, cached briefly.
- **Sign up** (`/signup`) — creates a **real Sugargoo account** through Sugargoo's own API (HMAC-signed request), which auto-generates the password. This also creates a persistent RAPID account under the hood (same email + password) and logs the user in — see Accounts below.
- **Log in / Account** (`/login`, `/account`) — RAPID has its own session, independent of Sugargoo's, but deliberately reuses the same email/password so it's one login for the user.
- **Wishlist** — logged-in users can save products anywhere on the site; view/manage them on `/account`.
- **Buying** always happens on sugargoo.com, not on RAPID.

## Tech stack

Next.js 14 (**pages router**, not app router), TypeScript, Tailwind CSS, hosted on Vercel. No test suite exists — changes are verified manually (dev server + direct API/DB checks), so be deliberate when changing behavior.

## Where things live

- `pages/` — routes. `pages/api/` — all backend logic (no separate server).
- `lib/` — integrations: Sugargoo API client/token management, Supabase, MailerLite, session/auth helpers, product-feed parsing.
- `components/` — shared UI (`Header`, `Footer`, `Stamp`, `Reveal`/motion primitives, `WishlistButton`, etc.).
- `contexts/` — React state for auth and wishlist, provided globally from `pages/_app.tsx`.
- `styles/globals.css` + `tailwind.config.js` — the design system (custom color tokens, shared button/card utility classes).

## Data & integrations, in brief

- **Products** — read-only import from a Google Sheet (`pages/api/products.ts`). Not a database; editing the sheet is how the catalog changes.
- **Accounts + wishlist** — Supabase (Postgres), accessed only server-side via a service-role key. Passwords are bcrypt-hashed — RAPID cannot recover or display the actual password once stored, by design.
- **Sessions** — a small custom httpOnly signed-cookie mechanism (not a third-party auth library).
- **Email marketing** — MailerLite, captures signups locally instead of relying solely on Sugargoo's own export.
- **Facebook Lead Ads** — a webhook that also creates Sugargoo accounts from ad-form leads.
- **Meta Pixel / Conversions API** — ad tracking on key funnel events.
- **Local analytics log** (SQLite) — lightweight signup-event logging, plus an admin dashboard to view it.

## Behavioral email automations

Three MailerLite automations react to on-site behavior, all triggered by "subscriber joins group" on a dedicated group (same pattern as the existing Post-Signup Onboard Flow):

- **Brand Nudge** — a logged-in user views a brand page but never clicks through to Sugargoo within 24h. Tracked via `behavior_events` (Supabase, `lib/db/behaviorEvents.ts`), evaluated hourly by `pages/api/cron/brand-nudge.ts`. Throttled to **at most one nudge per user per calendar week** (`lib/periodKey.ts`'s `isoWeekKey`) — a user who left several brands stale gets one email for the oldest/most-overdue brand, not one per brand.
- **Wishlist Digest** — digest of similar items (`lib/wishlistDigest.ts`, aesthetic-tag overlap against wishlisted brands), evaluated by `pages/api/cron/wishlist-digest.ts`. Throttled to **once per user per fortnight** (`isoBiweekKey`) via `automation_triggers` — the cron itself still runs weekly (see `vercel.json`), the fortnightly cadence lives entirely in the dedupe key since "every 2 weeks" isn't cleanly expressible in cron schedule syntax.
- **Post-Signup Friction Remover** — content is drafted in MailerLite (automation "Post-Signup Friction Remover") but sits on a standalone holding group, **not yet wired to real signups**. MailerLite's API has no way to insert a `workflow_activity` condition step into an existing automation, so gating this on "didn't open the welcome email in 24h" requires a manual edit in the MailerLite visual editor: open "Post-Signup Onboard Flow", after the welcome email add a 24h delay → condition (welcome email opened?) → No branch → paste this automation's email content in. Once wired, the standalone automation/group can be deleted.

Both cron routes require `Authorization: Bearer $CRON_SECRET` (Vercel's cron convention — see `vercel.json`'s `crons` and `lib/cronAuth.ts`) and target `MAILERLITE_BRAND_NUDGE_GROUP_ID` / `MAILERLITE_WISHLIST_DIGEST_GROUP_ID`. Both stage merge-field data via `upsertSubscriberFields` before calling `addSubscriberToGroup` (which fires the automation), then record `automation_triggers` so reruns are idempotent.

## Important notes for future agents

- **Vercel serverless functions freeze right after the HTTP response is sent.** Any "fire and forget" background work that does real async I/O (a `fetch` call fired via `setImmediate` and not awaited) can silently never complete — this has caused real, hard-to-diagnose bugs here. If an API route needs to call an external service, `await` it directly with a bounded timeout rather than deferring it.
- **Env vars live in two places.** Real secrets go in `.env.local` (gitignored, never committed) for local dev, and must **also** be added manually in the Vercel dashboard for production — there's no CLI/tool wired up in this environment to do that remotely.
- **The admin dashboard's access control is weak** (a client-side flag, not a verified server session) — treat it as trusted-network-only, not a hardened panel, until someone hardens it.
- **Older markdown docs in this repo are stale.** `README.md`, `PROJECT_SUMMARY.md`, `SETUP.md`, `SIGNUP_FLOW.md`, `START_HERE.md`, and `UPDATES_SUMMARY.md` predate the accounts/wishlist feature and the design-system rebuild, and contain outdated claims (e.g. "no user authentication," references to "Omnisend" where MailerLite is actually used). Verify against the code before trusting them.
- **This site converts on trust and speed.** Instant signup with no email verification is a deliberate product decision, not an oversight — don't "fix" it by adding friction without checking first.
