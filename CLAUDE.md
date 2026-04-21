# CLAUDE.md

## CRITICAL: Cloudflare API Key Safety

Cloudflare credentials are stored in `.env.local` as `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`. This is Rye's **Global API Key** (not an API Token) — it has full account access. It was entrusted to Davin by his boss — misuse is not an option.

**Auth method:** Global API Key auth requires both env vars:
```bash
CLOUDFLARE_API_KEY=<key>  CLOUDFLARE_EMAIL=rye.seekins@gmail.com  npx wrangler <command>
```

**Account:** `Rye.seekins@gmail.com's Account` — ID `84ab6b52009b008ace23b1a3fb20aef3`

**Rules:**
1. **NEVER** change any Cloudflare settings without explicit authorization from Davin
2. **NEVER** read or access the API key until Davin has approved a plan
3. Before any Cloudflare operation: present a detailed plan of what you intend to do, wait for approval, and only then proceed
4. When in doubt, ask first

---

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# From repo root
npm run dev          # Start all apps
npm run build        # Build all packages
npm run type-check   # TypeScript check across all packages

# From apps/web
npm run dev          # Next.js dev server
npm run build:cloudflare  # Cloudflare Workers build (use this to test prod builds)
npx wrangler deployments list  # Check deploy status
```

## Architecture

**Turborepo monorepo** with two workspaces:
- `apps/web` — Next.js 15.2.9 App Router, deployed to Cloudflare Workers via `@opennextjs/cloudflare`
- `packages/shared` — TypeScript types, Supabase DB types, pricing utils, validation

## Deployment (READ THIS BEFORE DEBUGGING PROD)

**The deployment architecture is confusing. Do not trust what the Cloudflare dashboard appears to tell you.** The real pipeline is:

1. Push to `main` → GitHub Actions workflow `.github/workflows/deploy.yml` runs
2. Workflow builds `apps/web` via `npm run build:cloudflare` (produces `.open-next/worker.js`)
3. Workflow runs `cd apps/web && npx wrangler deploy` which ships the standalone Worker named `junglegym` (defined in `apps/web/wrangler.toml`)
4. That Worker owns the custom domain `junglegym.academy` and serves all traffic — API routes, SSR pages, the lot

> **IMPORTANT — Adding env vars (read this before touching secrets)**
>
> | Var type | Where it lives | How to add |
> |----------|---------------|------------|
> | `NEXT_PUBLIC_*` (client-side) | GitHub Actions secrets + `deploy.yml` | 1. Add secret in GitHub → Settings → Secrets → Actions. 2. Add `NEXT_PUBLIC_FOO: ${{ secrets.NEXT_PUBLIC_FOO }}` to the `env:` block under "Build for Cloudflare" in `.github/workflows/deploy.yml`. 3. Push — Next.js inlines it at build time. |
> | Server-side secrets | Cloudflare Worker bindings | Run `CLOUDFLARE_API_KEY=<key> CLOUDFLARE_EMAIL=<email> npx wrangler secret put SECRET_NAME --name junglegym`. No redeploy needed — available instantly at `process.env.SECRET_NAME`. |
> | Deploy-time CF credentials | GitHub Actions secrets | Already set (`CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`, `CLOUDFLARE_ACCOUNT_ID`). These auth `wrangler deploy` and never need to be Worker secrets. |
>
> **Do NOT** add server-side secrets to `next.config.js`, `.env.local`, or bake them into the bundle. The old smuggling hack (`SERVER_SECRETS` array in `next.config.js`) was removed on 2026-04-08. Use `wrangler secret put` instead.

**There is ALSO a Cloudflare Pages project called `junglegym` (subdomain `junglegym-web.pages.dev`).** It is **vestigial** and **disabled** — production deployments and preview deploys were turned off on 2026-04-08 via the Cloudflare API. GitHub is still connected (easy to re-enable) but no builds fire on push. The project doesn't power production — the Worker does. Do not waste time debugging it. A future cleanup should delete it entirely.

**Prod env vars live in two places depending on whether they're client-side or server-side.**

### Client-side vars (`NEXT_PUBLIC_*`) → GitHub Actions secrets + deploy.yml build env

Next.js inlines `NEXT_PUBLIC_*` vars into the client bundle at build time. They need to be present in the environment of the `npm run build:cloudflare` step so the build can bake them in. To add one:

1. GitHub → Settings → Secrets and variables → Actions → add the secret
2. Edit `.github/workflows/deploy.yml` → add `NEXT_PUBLIC_FOO: ${{ secrets.NEXT_PUBLIC_FOO }}` to the `env:` block under "Build for Cloudflare"
3. Push → next deploy inlines it

Current `NEXT_PUBLIC_*` vars handled this way:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (hardcoded to `https://junglegym.academy` in deploy.yml, not a secret)

### Server-side vars → Cloudflare Worker secret bindings via `wrangler secret put`

Server-side secrets are injected at Worker runtime via Cloudflare secret bindings. `@opennextjs/cloudflare` wires these into `process.env` automatically.

**To add a new server-side secret:**
1. Run `CLOUDFLARE_API_KEY=<key> CLOUDFLARE_EMAIL=<email> npx wrangler secret put SECRET_NAME --name junglegym`
2. That's it — no redeploy needed. The value is available at `process.env.SECRET_NAME` immediately.

**To rotate a secret:** Same command, new value. Takes effect immediately without a redeploy.

**Current server-side secrets (set via `wrangler secret put`):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`

**History:** These were previously baked into the Worker bundle via a `.env.local` smuggling hack in `next.config.js` (Rye's original workaround). Migrated to proper Worker bindings on 2026-04-08. The smuggling code has been deleted.

### CLOUDFLARE_* in deploy.yml

`CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`, `CLOUDFLARE_ACCOUNT_ID` are only needed at deploy time — they authenticate `wrangler deploy` itself. Those live as GitHub Actions secrets and are referenced in the deploy step's `env:` block. They never need to be Worker secrets.

**Debugging prod:**
- Worker logs live at `wrangler tail junglegym` — run from `apps/web/` (Davin's local wrangler uses OAuth browser login, so no API key needed for interactive commands). NOT in the Pages dashboard's tail view.
- Deploy status: GitHub Actions tab on the repo, or `gh run list --workflow=deploy.yml`
- `wrangler.toml` lives at `apps/web/wrangler.toml` — Cloudflare's build autodetect looks at repo root and doesn't find it, hence the "No Wrangler configuration file found" line in Pages build logs. This is expected and harmless.

**Database**: Supabase (PostgreSQL + RLS + Storage). All schema is in `supabase/migrations/` — run them in order (00001–00006) to set up a fresh database.

**Auth**: `@supabase/ssr` with cookie-based sessions. Two client factories:
- `src/lib/supabase/server.ts` — for Server Components and Route Handlers (async, uses `cookies()`)
- `src/lib/supabase/client.ts` — for Client Components (`'use client'`)

**Middleware** (`src/middleware.ts`): Refreshes auth via `updateSession()`, protects `/dashboard /profile /studio /library /apply`, rewrites `/@username` → `/[username]`.

## Key Patterns

**Next.js 15**: `params` and `searchParams` are `Promise<{...}>` — always `await` them.

**Supabase join filters** on FK relations are unreliable — **NEVER use `profiles!creator_id(...)` or similar `!` join syntax.** These fail silently (return null) because there's no direct FK from `videos`/`live_sessions` to `profiles` — they're siblings through `users`. Always do two-step queries: fetch IDs first, then `.in('col', ids)`. This has caused prod-breaking 404s twice now (March 21, April 9).

**Client components using `useSearchParams()`** must be wrapped in `<Suspense>` in their parent page.

**Pricing**: Videos use 3-tier "fun pricing" (`packages/shared/src/utils/pricing.ts`). Prices are pre-calculated and stored on the video row — not computed at query time.

**Cloudflare builds**: Pinned to Next.js `15.2.9`. Do not bump Next.js — `@opennextjs/cloudflare@1.17.1` breaks with Next.js 15.4+.

## Data Model (short version)

- `users` — mirrors `auth.users`, has `role` ('creator' | 'learner')
- `profiles` — display info + creator pricing rates; `username` is unique slug
- `videos` — free or 3-tier paid; `published` flag; `creator_id → users`
- `purchases` — one per (user, video); `amount_paid` is creator's cut (80%); `platform_tip_pct` is the fee percentage (DB column name is legacy)
- `live_sessions` — creator-hosted classes with `scheduled_at`
- `gifts` — donations to live sessions with 20% platform fee
- `teacher_applications` — learner → creator upgrade requests (pending/approved/rejected)
- `video_shares` — one share token per (owner, video); `redeem_video_share` RPC creates a $0 purchase atomically

---

## What JungleGym Is

A movement video platform — yoga, dance, martial arts, breathwork, and beyond. Learners discover and buy videos directly from vetted teachers ("lead monkeys"). Pay once per video, own it forever.

**Mission**: Liquidate Physical Education. Replace the standardized, joyless model with vetted teachers sharing what they love, students choosing what moves them, money flowing directly to the source.

**Live at**: [junglegym.academy](https://junglegym.academy)

---

## Business Model

**Creators** publish video content tied to their profile, discoverable via recommendation algorithm.

**Pricing tiers** (creator sets their own per-minute rate):
- Supported: ~$1/min
- Community: ~$2/min
- Abundance: ~$3/min
- Prices round DOWN to nearest fun number: $1.11, $2.22, $3.33, $4.20, etc.
- Every creator is encouraged to offer one free video

**Platform fee**: Fixed 20% fee taken from the displayed price. The price the buyer sees is the total they pay — 80% goes to the creator, 20% to JungleGym. Recorded in DB as `platform_tip_pct` (legacy column name).

**Money flow**:
- All payments into JungleGym business accounts (Stripe/PayPal)
- Platform pays creators via Venmo for now, direct deposit eventually
- No Stripe Connect / instant payouts yet — manual batch payouts

**Sharing**: Each user who owns a video may share access with ONE other user (`video_shares` table + `redeem_video_share` RPC — already built).

---

## Claude Code Coordination

This file is the shared source of truth for all Claude Code instances working in this repo. The dev team (Davin + Rye) uses multiple Claude Code sessions, sometimes simultaneously.

**If you make a significant change, add an entry to the [Change Log](#change-log) at the bottom of this file.** Include: date, what changed, and why. This keeps all Claude instances and both teammates informed across sessions.

**Dev log requests**: When either Rye or Davis asks for a dev log, summary of recent work, or "what have we done" — read the Change Log section of this file. Do NOT attempt to use Notion for dev logs. CLAUDE.md is the source of truth for development history on this repo.

**If you receive new instructions that update how to work in this repo**, update the relevant section here so future instances inherit that knowledge.

---

## Team

| Person | Role | Contact |
|--------|------|---------|
| Rye Seekins | Founder, full-stack builder | rye.seekins@gmail.com |
| Davis Dunham | New team member | TBD |
| Emily (exploremorewithemily) | First creator, JungleGym OG | exploremorewithemily@gmail.com |

---

## Key Decisions Made

- **No Stripe Connect yet** — manual payouts via Venmo. Stripe Connect is planned but blocked on Stripe + PayPal account credentials from Rye.
- **Fun pricing is pre-calculated** — stored on the video row, not computed at query time.
- **Supabase FK join filters are unreliable** — never use `!` join syntax (e.g. `profiles!creator_id(...)`). Always do two-step queries. Broken joins return null silently and cause 404s.
- **Next.js pinned at 15.2.9** — do not bump; Cloudflare adapter breaks above this.
- **Google OAuth** — not yet added. Steps: Google Cloud Console creds → Supabase Auth providers → "Continue with Google" button in `LoginForm.tsx` and `SignupForm.tsx`.

---

## Roadmap / What's Not Built Yet

### Payments
- **Stack:** Stripe Checkout (implemented) + PayPal JS SDK (not yet)
- **What's built (branch rye/stripe-payments):**
  - `apps/web/src/lib/stripe.ts` — Stripe client singleton
  - `apps/web/src/app/api/checkout/video/route.ts` — creates Checkout Session for video purchases
  - `apps/web/src/app/api/checkout/membership/route.ts` — creates $100/month recurring Checkout Session
  - `apps/web/src/app/api/webhooks/stripe/route.ts` — handles `checkout.session.completed`, `customer.subscription.updated/deleted`
  - `PurchaseButton` updated to redirect to Stripe instead of writing directly to Supabase
  - `supabase/migrations/00010_memberships.sql` — memberships + membership_video_picks tables
  - `supabase/migrations/00011_email_captures.sql` — email captures table
  - Homepage: Membership section (id="membership") + email capture section added
- **Env vars needed:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (set in Stripe dashboard → Webhooks → add endpoint `/api/webhooks/stripe`)
- **Still needed:** PayPal JS SDK, Stripe Connect onboarding, video pick UI for members (`/library` or `/membership/picks`), PayPal webhook handler

### Google OAuth
- Steps: Google Cloud Console → create OAuth credentials → Supabase Auth → Providers → Google → add creds → "Continue with Google" button in `LoginForm.tsx` and `SignupForm.tsx`
- Why: reduce signup friction for creators like Emily

### Creator Notifications
- Creators notified when purchases come in (all payments go through JungleGym, not Stripe Connect)
- Modes (creator sets in studio settings): every purchase, daily summary, weekly summary, or threshold-only
- Implementation: Supabase Realtime on `purchases` table filtered by `creator_id` → toast in studio dashboard
- Add `notification_pref` column to `profiles` table
- Email fallback for offline creators

### Recommendation Algorithm
- Surface similar classes on video pages and after purchase

### Kinectr Integration
- JungleGym live sessions linking directly into Kinectr events
- Kinectr as the "profiles hub" that JungleGym plugs into

### SEO follow-ups
- **Google Search Console verification** — not done yet. Rye likely wants to own this (his Google account, his domain auth). Steps once he's ready:
  1. Add property at [search.google.com/search-console](https://search.google.com/search-console) — pick **Domain** verification for full coverage
  2. Add the TXT record in Cloudflare DNS (requires Davin's explicit approval per CF API rules)
  3. Submit `https://junglegym.academy/sitemap.xml` under Sitemaps
  4. Also link Bing Webmaster Tools — powers DuckDuckGo, way less competition for fitness keywords
- Sitemap is already live at `/sitemap.xml`, robots.txt at `/robots.txt` (added 2026-04-19)
- OG tags + JSON-LD structured data live on video, session, treehouse, and homepage

### Video soft-delete + purge cron

Creators can delete videos from `/studio/video/[id]/manage` (also self-restore from a dropdown on `/studio`). Rows get `deleted_at = now()` + `published = false` and disappear from every public list. Admins can restore from `/admin?tab=issues`.

After 30 days, `POST /api/cron/purge-deleted-videos` hard-deletes the row + all storage (video file, thumbnail, audio chunks, VTT). It's triggered daily at 04:00 UTC by `.github/workflows/purge-deleted-videos.yml`, protected by a shared `CRON_SECRET`.

**Setup (one-time)** — needed before the cron can run:
1. Generate a shared secret: `openssl rand -hex 32`
2. Add as GitHub repo secret named `CRON_SECRET`
3. Add as Worker secret: `CLOUDFLARE_API_KEY=… CLOUDFLARE_EMAIL=… npx wrangler secret put CRON_SECRET --name junglegym`
4. Manually trigger the workflow once to confirm it works (GitHub Actions → "Purge soft-deleted videos" → Run workflow)

### Admin issues panel (pattern for future code)

`/admin?tab=issues` shows:
1. **Transcription issues** — query-based, reads `videos` where `transcript_status IN ('failed', stuck-pending)` AND `transcript_issue_dismissed_at IS NULL`. Retry clears the dismissal so new failures resurface.
2. **Other issues** — reads the `admin_issues` table. Write one by importing `recordAdminIssue` from `@/lib/adminIssues` and calling it with `{ kind, severity, title, description?, context? }`. The helper never throws and uses the service client.

Call this from any server-side code when something goes wrong that an admin should see. Currently wired into:
- Stripe webhook: `charge.dispute.created`, `charge.refunded`, `payout.failed`/`.canceled`, signature failures, and unhandled handler errors.

Places that could emit issues but don't yet (pick up if they start causing quiet failures):
- `/api/wallet/topup/confirm` on non-duplicate txError
- `/api/checkout/video/confirm` when PI succeeded but the purchase row insert fails
- Transcription route, if you want generic-panel parity with the transcript-section

**Important:** don't emit for expected paths (e.g. `payment_intent.payment_failed` — that's a card decline, not an admin problem).

---

## JungleGym + Kinectr Connection

The movement niche (yoga, dance, etc.) is a natural beachhead for Kinectr — the local events platform built by MichaelDavid. JungleGym live sessions could directly link into Kinectr events. Kinectr as the "profiles hub" that JungleGym plugs into. Keep this in mind when designing live session and creator profile features.

---

## Git / Collaboration Workflow

Davin and Rye work in tandem. To avoid conflicts:
- **Use feature branches** — each person branches off `main` for their work (`git checkout -b name/feature`), opens a PR, merges when done
- **Communicate ownership** — agree before starting who owns what (e.g. "I'm on payments, you're on notifications")
- **Merge often** — keep PRs small, pull `main` frequently
- **Do not force-push `main`** — Rye renamed the repo on 2026-03-21 which reset origin history and caused a divergence. Avoid repo renames or force-pushes to main.

**Claude Code commit/push behavior:**
- **Commit after every meaningful change** — don't batch up work before committing
- **Do NOT push unless explicitly told to** — wait for "push", "push it", "go ahead and push", etc. before running `git push`
- **Reason**: Cloudflare Workers is linked to GitHub — every push triggers a full redeploy of the live site, so pushes should be intentional and batched

**Note on repo rename**: The repo was previously `JungleGym-` (with trailing dash). The rename cleared origin's git history. Davin synced via `git reset --hard origin/main` on 2026-03-21 to align with Rye's 12-commit history.

---

## Change Log

| Date | Who | What | Why |
|------|-----|------|-----|
| 2026-03-19 | Davin | Added Claude Code coordination section + this change log to CLAUDE.md | Multiple Claude instances need shared context across sessions |
| 2026-03-19 | Rye | Expanded roadmap with full detail on payments, OAuth, notifications, Kinectr | .claude/ is gitignored — CLAUDE.md is the shared memory |
| 2026-03-21 | Davin | Synced local main to origin after repo rename caused history divergence | Rye renamed repo which reset origin; used git reset --hard origin/main |
| 2026-03-21 | Davin | Added Git/Collaboration Workflow section to CLAUDE.md | Established feature branch workflow to prevent future conflicts |
| 2026-03-21 | Davin | Fixed 7 bugs from Notion tracker (branch davin/bug-fixes) | Profile 404s (two-step query), video edit URL fields, homepage auth nav, Seeds profile save, nav color consistency, tip→donation rename, Dashboard→Library rename |
| 2026-03-21 | Davin | Built Treehouse page — rich creator profile at `/@username` | Full dark-jungle redesign: hero banner with avatar/bio/tags/location, pricing rates bar, live session cards (with live-now state), free + paid video grids with tier pills, empty state, footer. TypeScript clean. |
| 2026-04-06 | Rye | Stripe payments + Membership + email capture | Hooked up real Stripe Checkout for video purchases (was writing to Supabase directly with no payment). Added $100/month Membership (6 video picks, 80% to creators). Added email capture form. Branch: rye/stripe-payments. |
| 2026-04-08 | Davin | Replaced Stripe Checkout with inline Payment Elements | Users now pay without leaving JungleGym. New `PaymentForm` component, `/api/checkout/video` rewritten to return a PaymentIntent clientSecret, new `/api/checkout/video/confirm` route verifies the intent on redirect (so purchases are recorded even without webhooks — important for local dev). Webhook handler extended with `payment_intent.succeeded`. Branch: davin/stripe-payment-elements, merged to main. |
| 2026-04-08 | Davin | Fixed wrangler v3/v4 peer-dep mismatch breaking Cloudflare build | `@opennextjs/cloudflare@1.17.1` peer-depends on `wrangler@^4.65.0`; `apps/web` was pinning `^3.91.0`. The version mismatch caused npm to keep wrangler in `apps/web/node_modules` while hoisting `@opennextjs/cloudflare` to the repo root, so the Worker build failed with `Cannot find package 'wrangler'`. Bumped to `^4.65.0` — works now. |
| 2026-04-08 | Davin | Documented the real deployment architecture in CLAUDE.md | The Pages project is vestigial; the actual prod pipeline is GitHub Actions → `wrangler deploy` → standalone Worker `junglegym`. Spent hours this session not knowing this — nobody else should. |
| 2026-04-08 | Davin | Migrated server-side secrets off `.env.local` smuggling hack onto `wrangler secret put` Worker bindings | The smuggling approach (Rye's `SERVER_SECRETS` array in `next.config.js`) baked secrets into the bundle at build time. Replaced with proper Cloudflare Worker secret bindings — set once via `wrangler secret put`, available at runtime without a redeploy. Deleted `SERVER_SECRETS` array, debug endpoint, and migration runbook. `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` are now Worker bindings. |
| 2026-04-08 | Davin | Disabled vestigial Cloudflare Pages project | Turned off production and preview deployments on the `junglegym` Pages project via CF API. GitHub still connected but no builds fire. Saves build minutes — the Worker is the real prod pipeline. |
| 2026-04-13 | Rye/Claude | Welcome page, admin panel, contact fix, UI polish | Created `/welcome` — hidden creator invite page (noindex) with dawn/baby soil theme, blurred dot overlays, alternating section colors (white/amber-50/stone-100/jungle-900 CTA), direct copy. Added admin-only panel to Studio showing the `/welcome` invite link. Fixed contact page email `hello@` → `rye@junglegym.academy` (no routing rule existed for hello@). Fixed smart-quote syntax error that broke CI build. |
| 2026-04-13 | Davis | Major feature push | Cloudflare Stream live streaming scaffolding (`StreamPlayer`, `StreamSetup`, provision/webhook API routes). Ghost tags — AI-generated internal search tags on video save, visible to admins on video page. Unified `SearchBar` with relevance ranking + creator name search. Single-screen purchase (tier picker + payment form together). Inline Stripe payment for live session gifts with animated success. Suggested tip setting per creator. Separate Explore (discovery) and Classes (video library) pages. Footer added to all pages. Sessions search/filter. `/contact` page. `/sessions/[id]` detail page. DB migrations: suggested_tip (00014), cf_stream_columns (00015), ghost_tags (00016). |
| 2026-04-09 | Davin | Studio creator tools overhaul (big batch) | **Checkout**: added Navbar so users don't feel locked in. **Security**: replaced `getSession()` with `getUser()` on all server auth checks. **Tags**: bubble input UI (space/comma to confirm), movement tag vocabulary with title-based suggestions, hyphens displayed as spaces, hyphen/underscore normalization. **Avatar crop**: square/circle toggle (default square), fixed zoom slider for large photos (dynamic minScale), logarithmic zoom, cache-bust on upload. **Video manage page** (`/studio/video/[id]/manage`): replaces `/edit` (redirect kept); metrics tab (views, purchases, earnings, transactions table with buyer/tier/split breakdown); settings tab with thumbnail preview + video scrubber picker, editable pricing, iOS-style toggle switches; publish toggle at header. **Thumbnail scrubber**: signed URL fix for private bucket, loading spinner. **Pricing inputs**: `PriceInput` shared component with stacked chevron arrows, tiered step sizes (0.05→0.10→0.25→0.50→1.00). **Settings**: `/settings` is now canonical (was `/profile`); studio settings (pricing rates) merged inline for creators; `/profile` redirects to own treehouse; `/studio/settings` redirects to `/settings`. **Storage RLS**: added `thumbnails: creator update` policy (was missing — blocked upsert on existing thumbnails, migration 00013). **Video player**: `controlsList="nodownload"` to hide download button. |
| 2026-04-15 | Davin | Applied `instagram_url`/`website_url` migration to Supabase | Migration `00012_profile_social_links.sql` existed but had never been run against the live DB. Applied the `ALTER TABLE` directly via SQL editor — columns now live. Treehouse hero edit/save was already fully wired up. |
| 2026-04-15 | Davin | Parallax forest background on homepage | Added `ParallaxForest` client component (`src/components/ParallaxForest.tsx`) — fixed background div using `jungle-gateway-web.jpg` that translates upward at 30% of scroll speed via a passive scroll listener, creating a climbing-down-a-tree feeling. Hero and philosophy sections use a `bg-jungle-950/70 backdrop-blur-sm` overlay for readability; white/stone panels scroll over the image at full speed. Rebased on top of Rye's 30-commit homepage redesign (resolved conflicts, replaced Rye's static `background-attachment: fixed` with the JS parallax). |
| 2026-04-15 | Davin | Skeleton loaders + instant navigation across all pages | **Suspense skeletons**: Extracted data-fetching into async `*Content.tsx` sub-components on all 16 pages, wrapped in React Suspense with page-matched skeleton fallbacks (`components/skeletons.tsx`). Explore page has 3 independent Suspense boundaries for granular streaming. **`loading.tsx` files**: 16 route-level loading states reusing the same skeletons — page shell appears instantly during client-side navigation (no blank gap). **Route progress bar**: `RouteProgress` client component renders a thin jungle-green bar at the top on every navigation, intercepts link clicks for immediate feedback. **Pixel tree animation**: Library page uses a procedurally generated pixel art growing tree (`GrowingTree` component) instead of skeleton grid — canopy grows bottom-to-top with per-pixel stagger. |
| 2026-04-15 | Davin | Session manage: cancel button + remove manual status bar | Added "Cancel Session" button with confirmation modal to `/studio/sessions/[id]/manage`. Removed the manual status toggle bar — status (scheduled/live/completed/cancelled) will be driven by the live stream backend automatically. Cancel is the only manual status action creators need. |
| 2026-04-15 | Davin | Cloudflare Stream live streaming — fully operational | **Backend activated**: CF Stream API token, account ID, customer code, and webhook secret set as Worker secrets. Webhook URL configured via CF API. Migration 00015 (cf_stream_columns) applied. **In-browser streaming**: `BrowserStreamClient` component — creators go live from the browser via WebRTC/WHIP, no OBS required. Camera/mic preview, device selectors, hot-swap while live. `StreamSetup` offers "Stream from browser" (default) vs "Use OBS" toggle. **WHIP proxy**: `/api/stream/whip` proxies SDP signaling through our origin (CF WHIP endpoint blocks CORS). Fetches signed WHIP URL from CF API on each request (the URL contains an auth token in the path — constructing our own didn't work). **Pause/Resume/End controls**: Pause disconnects WebRTC (stops CF billing), sets `paused_at` in DB, starts 15-min auto-end timer. Viewers see a "Be right back" overlay (player stays rendered). Resume re-establishes WHIP and clears pause. End sets status to `completed`. **Server-side cleanup**: Status polling endpoint auto-completes sessions paused >15 min. `beforeunload` + WebRTC disconnect events set `paused_at` as safety nets for tab close/network loss. **Auto-refresh viewer page**: `SessionAutoRefresh` polls `/api/sessions/[id]/status` every 5 seconds, triggers `router.refresh()` on status change — stream player replaces placeholder automatically. **Session time fixes**: `LocalTime` client component for viewer-timezone formatting (server runs UTC on CF Workers). `suppressHydrationWarning` on all client components with date formatting. Stream placeholder shows context-aware messages (scheduled/starts soon/running behind). Sessions stay visible on all pages through their full duration window. **BRB timing**: `paused_at` is only cleared when the WHIP connection actually succeeds (not on resume click), so viewers see the BRB overlay through the entire reconnection window. Iframe force-reloads on unpause via key change (CF player doesn't auto-recover). **Autoplay + unmute**: Stream autoplays muted with a "Tap to unmute" overlay — one tap to get audio, no double play-button clicking. **Other fixes**: Explore page guides now uses service client (RLS fix). Admin quick links moved from Studio to Admin page. Migration 00017 (paused_at). **Bug filed**: Supabase Realtime WebSocket fails on prod — trailing space in `NEXT_PUBLIC_SUPABASE_ANON_KEY` GitHub Actions secret (fix: re-paste without space, redeploy). |
| 2026-04-16 | Davin | Stream pause/resume rewritten — track swapping instead of WHIP disconnect | **Problem**: Disconnecting/reconnecting the WHIP stream on pause caused ~20% resume failure rate. CF's iframe player crashed during protocol renegotiation (LL-HLS 405, WHEP 404, Shaka null manifest). Also discovered WHIP+HLS don't work together — CF doesn't generate HLS manifests for WHIP-ingested streams, only WHEP playback works. **Solution**: Instead of disconnecting the WHIP stream on pause, `BrowserStreamClient` now uses `RTCRtpSender.replaceTrack()` to swap the real camera/mic tracks for a black canvas video track + silent oscillator audio track. The WHIP connection stays alive, so the CF iframe never loses its WebRTC session. On resume, real tracks are swapped back in — instant, no protocol renegotiation. **Viewer side**: BRB overlay still driven by `paused_at` in DB. `StreamPlayer` uses CF iframe with postMessage mute control (`__privateUnstableMessageType: 'setProperty'`). `LiveSessionWrapper` simplified to just `setPaused(p)` — no key bump, no delay, no retry logic needed. **Tradeoff**: CF billing continues during pause (stream technically still live), but negligible with the 15-min auto-end timer. |
| 2026-04-17 | Davin | Stripe Connect for automatic creator payouts | **Stripe Connect Express** with destination charges. Creators connect bank account via Settings page → Stripe-hosted onboarding → automatic 80/20 split on every video sale. Migration 00018 (`stripe_account_id`, `stripe_onboarding_complete` on profiles). API routes: `/api/connect/onboard`, `/onboard/refresh`, `/dashboard`, `/status`. `StripeConnectSection` component in Settings (not connected / pending / connected states). Video checkout creates destination charges with `application_fee_amount` (20%) + `transfer_data` when creator is connected, falls back to JungleGym-only if not. Webhook handles `account.updated`. Upload page locks paid toggle until Stripe connected. `STRIPE_WEBHOOK_SECRET` set as Worker secret. Webhook endpoint configured in Stripe Dashboard with all 12 event types. Notion setup guide created for replicating on Rye's live Stripe account. Tested and working on prod (test mode). |
| 2026-04-21 | Davin | Auto-transcription: closed captions + transcript-powered ghost tags | **Pipeline**: browser extracts audio from uploaded videos via `ffmpeg.wasm` (48kbps mono Opus/WebM, 15-min chunks), uploads to new `transcripts` bucket, fires `POST /api/transcribe/[videoId]`. Route runs Groq Whisper `large-v3-turbo` on each chunk in `after()`, merges segment timestamps (offset by chunk index × 900s), writes WebVTT to `transcripts/vtt/{id}.vtt`, updates videos row, and regenerates ghost tags from the transcript. Captions render via native `<track kind="captions" default>` — always on, no toggle, browsers handle the CC button. **Ghost tag prompt rewritten** to explain the recommendation-algorithm purpose and spell out 7 categories (style, body focus, intensity, skill, session type, mood, equipment) — transcript becomes primary signal when present. **Retry logic**: one automatic retry in-route; failures surface on a new `/admin?tab=issues` panel with a manual Retry button (re-uses audio chunks already in storage). Also catches pending rows stuck >10min (case where browser extraction failed before we ever called the API). **Bumps along the way**: (1) `ffmpeg-core.wasm` is 32MB, CF Workers caps static assets at 25MB → load core.js/.wasm from unpkg at runtime, added `connect-src https://unpkg.com` to CSP. (2) Passing `classWorkerURL` to `ffmpeg.load()` hung forever because the library's worker.js has static relative imports that can't resolve against blob: URLs — dropped the arg and let webpack 5 bundle the library's built-in worker as a same-origin chunk. (3) Audio upload + transcribe trigger moved out of the blocking submit flow into a post-navigation IIFE so creator returns to /studio immediately. (4) Native `<track>` element refused cross-origin VTT from Supabase ("Unsafe attempt to load URL"); added a Next rewrite so `/captions/*` → Supabase storage, making the VTT effectively same-origin. Migration `00027_video_transcripts.sql` adds `transcript_text`, `transcript_vtt_path`, `transcript_status`, `transcript_error`, `transcript_attempts` columns + `transcripts` storage bucket (public read, creator write under `audio/{userId}/...`). Branch: `davin/auto-transcription`. Not backfilling existing videos — creators will reupload. |
| 2026-04-21 | Davin | Soft-delete for videos (creator delete + 30-day admin undo) | Delete button on `/studio/video/[id]/manage` with a confirmation modal. Writes `deleted_at = now()` and `published = false` so the video disappears immediately from explore/classes/treehouse/library/sitemap/video page/checkout/share — every public `.from('videos')` query got `.is('deleted_at', null)` added. Creator's studio view also filters out deleted. Admins see a new "Recently deleted" section on `/admin?tab=issues` with a Restore button (uses a `restoreDeletedVideo` server action + service client since RLS won't let admins touch creator rows directly). Restore clears `deleted_at` but leaves `published=false` so the creator reviews before republishing. Migration `00028_video_soft_delete.sql` adds the `deleted_at timestamptz` column + a partial index. |
| 2026-04-21 | Davin | Purge cron + creator-side restore dropdown | Wired up the 30-day hard-delete job that was flagged as follow-up. `POST /api/cron/purge-deleted-videos` (protected by `CRON_SECRET` header) scans for `deleted_at < now() - 30 days`, deletes the video file, thumbnail, audio chunks, and VTT from storage, then deletes the row. Daily trigger via `.github/workflows/purge-deleted-videos.yml` at 04:00 UTC; manually triggerable for testing. **Creator-side restore**: new `DeletedVideosDropdown` component on `/studio` — collapsible "Recently deleted (N)" section below the video list, shows each deleted video with grayscale thumbnail, days-remaining badge, and a Restore button. Uses a direct client-side update since creators own their rows (RLS "videos: creator update" allows it) — no server action needed. **Setup pending**: `CRON_SECRET` needs to be generated and set as both a GitHub repo secret and a Worker secret (one-time — instructions in CLAUDE.md under "Video soft-delete + purge cron"). |
| 2026-04-21 | Davin | Dismissable admin issues + centralized `admin_issues` table | Per-row × dismiss button on the Issues panel (both the existing transcript failures and a new generic section). Retry clears `transcript_issue_dismissed_at` so a new failure after dismissal resurfaces. New `admin_issues` table (service-role only) with `kind` / `severity` / `title` / `description` / `context` — any server-side code can import `recordAdminIssue` from `@/lib/adminIssues` to surface something for an admin. Wired the Stripe webhook to emit issues for `charge.dispute.created` (error — has a response deadline), `charge.refunded` (info — needs access-revocation decision), `payout.failed`/`.canceled` (error — creator money stuck), signature verification failures (error — secret drift or probing), and unhandled errors inside any case (returns 500 so Stripe retries). Server actions: `dismissTranscriptIssue(videoId)`, `dismissAdminIssue(issueId)` — the latter stamps `dismissed_by` with the admin's email. Migration 00029 adds `videos.transcript_issue_dismissed_at` + the `admin_issues` table. Pattern documented in CLAUDE.md under "Admin issues panel (pattern for future code)" with a list of other places that could emit issues (wallet topup confirm, video purchase confirm) when they start causing quiet failures. |
