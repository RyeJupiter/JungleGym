# CLAUDE.md

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
- `purchases` — one per (user, video); `amount_paid` goes 100% to creator; optional `platform_tip_pct`
- `live_sessions` — creator-hosted classes with `scheduled_at`
- `gifts` — donations to live sessions with adjustable platform tip
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

**Platform tip**: Suggested 10% to JungleGym at checkout ("Tip the jungle gym?"), adjustable 0–200%. Recorded in DB as `platform_tip_pct` — not a checkout line item.

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
