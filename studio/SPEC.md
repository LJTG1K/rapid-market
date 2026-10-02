# RAPID Studio — Spec (v1)

A small internal web app that lets the RAPID team edit site content (brands, Gilly's Picks, product copy, blog) without Claude Code or touching the repo by hand. Agreed in a design session on 2026-10-02; this file is the source of truth for scope until the code exists, after which the code wins.

## Goals

- Anyone on the team can make a content change in minutes, with no git/JSON knowledge.
- A bad edit can't break the public site, and any publish can be undone in one click.
- Every change is attributable and visible before it goes live.

## Non-goals (v1)

- Roles / per-user permissions (everyone is a full editor).
- Editing hardcoded marketing copy in TSX (homepage, campaign pages).
- Analytics / signups / pixel-ledger views.
- Scheduled blog publishing.
- Adding or deleting product rows — new products are still bulk-pasted into the Google Sheet.
- Mobile layouts — desktop only.

## Users & access

- Small trusted team, **one shared password** stored in env (`STUDIO_PASSWORD`), rotatable by changing the env var (rotation invalidates all sessions).
- Login is rate-limited per IP; sessions are signed httpOnly cookies lasting 30 days.
- On first use per device the app asks **"Who's editing?"** and stores the name locally. That name is stamped on every draft, change-log row and commit message (honour system — not authentication).
- Served at the default `*.vercel.app` URL. `noindex` everywhere (meta tag + `X-Robots-Tag` header + `robots.txt` disallow). A `studio.rapid.market` subdomain can be added later at no cost.

## Architecture

- Lives in `rapid-market/studio/` as its own Next.js app, deployed as a **separate Vercel project** (Root Directory = `studio`).
- Imports shared logic directly from the site's `lib/` (`brandMatch`, `styleMatch`, brand/product types) so validation and match counts can never disagree with the live site. Previews import the site's real components (`ProductCard`, blog renderer, brand card) and design tokens.
- **Ignored Build Step** on both Vercel projects so studio-only commits don't redeploy the site and site-code commits don't redeploy studio. Content commits made by Studio (`public/data/**`) *must* redeploy the site.
- Stack: Next.js + TypeScript + Tailwind + shadcn/ui.

### Data sources

| Content | Source of truth | How Studio writes it |
|---|---|---|
| Brands | `public/data/brands.json` (git) | GitHub Contents/Git Data API commit |
| Gilly's Picks | `public/data/gillys-picks.json` (git, new — see Site changes) | GitHub commit |
| Blog posts | `public/data/blog-posts.json` + `public/data/blog/*.md` (git) | GitHub commit |
| Blog images | Supabase Storage bucket (`blog-images`, public read) | Direct upload at insert time |
| Product copy | Google Sheet (cols A–H: id, name, image, description, price, link, style tags, fit) | Sheets API via service account |
| Drafts, change log, editor state | Supabase (new tables, see below) | Server-side, service-role key |

## Features

### 1. Brands

- List view: searchable/filterable table of all brands (name, slug, tag chips, product match count).
- Create / edit form for every field in the existing schema: `brandName`, `slug`, `description`, `aesthetic[]`, `targetCustomer`, `notes`.
- **Slug is locked after creation** (auto-generated from name on create, editable only before the first publish).
- **Rename / delete guard:** because products are linked to brands by regex on product *name* (`lib/brandMatch.ts`), renames and deletes show *"currently matches N products → after this change matches M"* and require explicit confirmation when M < N.
- **Aesthetic tags:** picker that autocompletes from the existing vocabulary with usage counts. New tags are allowed but marked "new tag" in the pending tray, since `lib/styleMatch.ts` scores the style quiz against this vocabulary.

### 2. Gilly's Picks

- Keeps the current **ID-range model**: edit `min`, `max`, `perVisit`.
- Editor shows a live preview of which products fall in the range (count + thumbnails) and warns if the range contains fewer products than `perVisit`.

### 3. Product copy

- Searchable, filterable table over the Sheet rows (filter by brand via `brandMatch`, category tab, missing description, etc.).
- Inline editing of name, description, price, style tags, fit. ID, image and link are read-only in v1.
- Edits are drafts like everything else (see Publish model) — nothing writes to the Sheet until Publish.
- The Sheet stays an editable surface for humans; Studio must tolerate concurrent direct edits (see conflict checks).

### 4. Blog

- Rich-text (Notion-style) editor that serializes to Markdown matching the existing `.md` files.
- Metadata fields mapped to `blog-posts.json`: title, slug (locked after first publish), excerpt, author, publishedAt, readTime (auto-estimated, overridable), category (picker from existing + new), featured toggle.
- SEO fields: meta description, social share image (both new optional fields in `blog-posts.json`; the site must read them — see Site changes).
- Image insert uploads to Supabase Storage, resized/compressed on upload (max ~1600px wide, WebP/JPEG), URL embedded in the Markdown.

## Publish model

- **Every edit is a shared draft** stored in Supabase. One team-wide **"Pending changes (N)"** tray shows all queued drafts with author and time.
- Same item edited by two people: last save wins, and the tray shows *"overwrote X's edit"*.
- Tray shows **field-level diffs** (old → new) plus **visual previews** for brands and blog posts using the site's real components.
- **Publish** (stamp-red button) ships the whole queue:
  1. **Validate** — JSON schema for every git-backed file, unique slugs, required fields, Markdown renders, no empty brand names, etc. Any failure blocks the publish with a readable error.
  2. **Sheet conflict check** — for every queued cell, confirm the Sheet still holds the value the draft started from. Mismatches are listed as conflicts; the user resolves (keep mine / keep sheet) before publishing.
  3. **Git commit** — all git-backed changes in **one commit** to `main`, message summarizing the changes and naming the editor. Use the parent SHA for optimistic concurrency; if `main` moved, rebase the file changes and retry, or fail clearly.
  4. **Sheet write** — batch-update the queued cells.
  5. Write change-log rows, clear the published drafts.
- **Deploy status** banner from the Vercel API: Live / Deploying / Failed, linking to the deployment.
- **Revert last publish:** creates a `git revert` commit for the publish's commit *and* restores previous Sheet values from the change log, skipping (and reporting) any cell changed since that publish.
- **Change log:** every published field change recorded as (publish id, editor name, target, field, old value, new value, timestamp). Viewable in a History screen. This is the Sheet's only history.

## Supabase tables (new)

- `studio_drafts` — id, target_type (brand | picks | product | blog), target_key, payload (jsonb), base_value (jsonb, for conflict checks), editor_name, updated_at, overwrote_editor.
- `studio_publishes` — id, editor_name, commit_sha, created_at, status, reverted_by.
- `studio_changes` — id, publish_id, target_type, target_key, field, old_value, new_value.
- Storage bucket `blog-images`.

SQL goes in `sql/studio_*.sql`, following the existing `sql/pixel_events.sql` convention.

## Design

- Neutral, dense, Linear/Notion-style base. RAPID accents only where they carry meaning: **stamp red `#BC3A1D` = Publish** (the one "act now" action), **teal `#155E58` = status and tags**.
- Desktop only; no mobile breakpoints required.
- Layout: left nav (Brands, Products, Picks, Blog, History), persistent pending-changes tray + Publish button, deploy-status indicator in the header.

## Site changes required (rapid-market)

1. Move Gilly's Picks constants (`PICK_ID_MIN`, `PICK_ID_MAX`, `PICKS_PER_VISIT` in `pages/gillys-picks.tsx`) into `public/data/gillys-picks.json` and read from it.
2. Blog pages read optional SEO fields (meta description, share image) from `blog-posts.json`, falling back to excerpt / default image. Blog renderer must allow Supabase Storage image URLs (`next.config` image domains if using `next/image`).
3. Add an Ignored Build Step so `studio/**`-only commits don't redeploy the site.

## Credentials & setup (owner-only steps — provide a setup wizard)

- `STUDIO_PASSWORD`, `STUDIO_SESSION_SECRET`
- `GITHUB_TOKEN` — fine-grained PAT scoped to `LJTG1K/rapid-market`, Contents: read/write only
- `GOOGLE_SERVICE_ACCOUNT_JSON` — service account with **Editor** access shared on the products Sheet; plus the existing sheet ID(s)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (existing project)
- `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` (site project) — for deploy status
- All set in the Studio Vercel project's env vars (manually, per AGENTS.md) and in `studio/.env.local` for dev.

## Deferred to v2

- Scheduled blog posts (needs a cron that commits).
- Per-user accounts / roles.
- Editing homepage & campaign copy.
- Read-only analytics views (signups, wishlists, pixel ledger).
- Adding / deleting product rows; hand-curated picks list.

## Build status

**Slice 1 — built 2026-10-02:** shared-password login (rate-limited, 30-day sessions, noindex), "Who's editing?" attribution, brands list (search, pending / no-products filters, live match counts), brand editor (create / edit / delete, slug lock, rename-drops-products guard, tag picker with usage counts and "new" flags), shared draft queue with field diffs, Publish (validate → one commit, retry if `main` moved), History with revert-last-publish. Deploy-status pill appears once `VERCEL_TOKEN` is set.

Deviations from the spec so far:
- UI primitives are hand-written Tailwind in shadcn's style (`components/ui.tsx`) rather than the shadcn CLI.
- Brand previews (site components) are not built yet; the editor shows the live product-match list instead.
- Revert undoes git-backed changes only, because Sheet-backed content doesn't exist yet.

**Slice 2 — built 2026-10-02:** Gilly's Picks editor (first/last product ID, per visit) with pool stats (size, gaps, carried-over vs new against live), a "move range to newest" shortcut, and a shuffled preview of one visit using real product images. The site now reads `public/data/gillys-picks.json` instead of constants in `pages/gillys-picks.tsx`. Drafts, publish and revert became multi-file: one publish can touch `brands.json` and `gillys-picks.json` in a single commit, and revert undoes both.

**Next:** slice 3 = product table on the Sheet, slice 4 = blog.

**Before going live with GitHub publishing:** the site change (`public/data/gillys-picks.json` + `pages/gillys-picks.tsx`) must be on `main`, or picks publishes fail because the file doesn't exist there yet.

## Running locally

```
cd studio && npm install
cp .env.example .env.local   # set STUDIO_PASSWORD + STUDIO_SESSION_SECRET at minimum
npm run dev                  # http://localhost:3100
```

Without `GITHUB_TOKEN` and with `STUDIO_STORE=local`, Studio runs fully offline-safe: drafts go to `studio/.data/store.json` and Publish writes straight into this working copy's `public/data/` (review with `git diff`). Both local modes refuse to run on Vercel.

## Going live (one-time)

1. Run `sql/studio_tables.sql` in the Supabase SQL editor.
2. Create a fine-grained GitHub PAT: repo `LJTG1K/rapid-market` only, Contents read & write.
3. New Vercel project from the same repo, Root Directory `studio`, "Include files outside the root directory" on (Studio imports `../lib`).
4. Set its env vars from `studio/.env.example` (`STUDIO_STORE=supabase`, plus the Supabase, GitHub and optional Vercel values).
5. The root `vercel.json` now has an `ignoreCommand` so Studio-only commits don't redeploy the site; `studio/vercel.json` does the reverse.
