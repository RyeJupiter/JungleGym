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
- Worker logs live at `wrangler tail junglegym` (requires CF auth) — NOT in the Pages dashboard's tail view, which returns "static site, cannot tail" because Pages isn't serving anything dynamic
- Deploy status: GitHub Actions tab on the repo, or `gh run list --workflow=deploy.yml`
- `wrangler.toml` lives at `apps/web/wrangler.toml` — Cloudflare's build autodetect looks at repo root and doesn't find it, hence the "No Wrangler configuration file found" line in Pages build logs. This is expected and harmless.

**Database**: Supabase (PostgreSQL + RLS + Storage). All schema is in `supabase/migrations/` — run them in order (00001–00006) to set up a fresh database.

**Auth**: `@supabase/ssr` with cookie-based sessions. Two client factories:
- `src/lib/supabase/server.ts` — for Server Components and Route Handlers (async, uses `cookies()`)
- `src/lib/supabase/client.ts` — for Client Components (`'use client'`)

**Middleware** (`src/middleware.ts`): Refreshes auth via `updateSession()`, protects `/dashboard /profile /studio /library /apply`, rewrites `/@username` → `/[username]`.

## Key Patterns

**Next.js 15**: `params` and `searchParams` are `Promise<{...}>` — always `await` them.

**Supabase join filters** on FK relations are unreliable. Do two-step queries: fetch IDs first, then `.in('col', ids)`.

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
- **Supabase FK join filters are unreliable** — always do two-step queries.
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
