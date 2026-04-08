# Worker Secrets Migration Runbook

Migrating JungleGym's production secrets off the `.env.local` smuggling hack in `apps/web/next.config.js` onto Cloudflare Worker secret bindings via `wrangler secret put`.

**Branch:** `davin/worker-secrets-cleanup`

**Why:** See the session notes on 2026-04-08 + the "Deployment" section of CLAUDE.md. The current pattern bakes secrets into `.open-next/worker.js` in plaintext, rotation takes ~2 minutes, and the mechanism is non-obvious to the point of losing hours to it. Worker secret bindings solve all three.

**Delete this file once migration is complete** — it's a working document, not permanent docs.

---

## Pre-flight facts (verified 2026-04-08)

- **Worker name:** `junglegym` (defined in `apps/web/wrangler.toml`)
- **Account:** Rye's Cloudflare account, ID `84ab6b52009b008ace23b1a3fb20aef3`
- **Current Worker secrets:** none (`wrangler secret list --name junglegym` returns `[]`)
- **Deploy mechanism:** GitHub Actions `.github/workflows/deploy.yml` runs on push to main, uses `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` + `CLOUDFLARE_ACCOUNT_ID` to `wrangler deploy`
- **wrangler auth on Davin's desktop:** logged in as `rdavisdunham@gmail.com` via OAuth, has write access to both Davin's own account and Rye's account — needs to pick Rye's when prompted, or set `CLOUDFLARE_ACCOUNT_ID=84ab6b52009b008ace23b1a3fb20aef3` to skip the prompt

## Secrets to migrate

Currently in `SERVER_SECRETS` array in `apps/web/next.config.js`:

1. `SUPABASE_SERVICE_ROLE_KEY`
2. `STRIPE_SECRET_KEY`
3. `STRIPE_WEBHOOK_SECRET`

These are all also referenced in the `Build for Cloudflare` step `env:` block of `deploy.yml` and exist as GitHub Actions secrets. After migration, they'll be removed from next.config.js, deploy.yml, and (optionally) GitHub Actions secrets.

---

## Step 1: Verify OpenNext actually reads Worker bindings into process.env

Before we remove anything from the bundle, prove the binding path works on this repo's version of `@opennextjs/cloudflare`. If it doesn't, the whole migration is a no-go and we need a different approach (or an OpenNext upgrade).

### 1a. Deploy the debug endpoint

The debug route is already committed on this branch at `apps/web/src/app/api/debug/env-bindings/route.ts`. It returns a JSON summary of which expected keys are present in `process.env` at request time (presence + length + 6-char prefix, never full values).

```bash
# Merge this branch's debug endpoint into main so it ships to prod
git checkout main
git merge davin/worker-secrets-cleanup --no-ff -m "debug: add env-bindings endpoint for secrets migration verification"
git push origin main
# Wait for GitHub Actions to deploy (~2 min)
gh run list --workflow=deploy.yml --limit 1  # should show 'completed success'
```

### 1b. Verify the debug endpoint sees the currently-bundled secrets

```bash
curl -s https://junglegym.academy/api/debug/env-bindings | jq
```

Expected:
- `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: all `present: true` (they're in the bundle via .env.local)
- `TEST_BINDING`: `present: false` (hasn't been set anywhere yet)
- `NEXT_PUBLIC_*`: all `present: true` (inlined at build time)

If any of the bundled secrets are missing, stop and debug — the bundle isn't working the way we think it is.

### 1c. Set a test Worker secret that is NOT in the bundle

```bash
export CLOUDFLARE_ACCOUNT_ID=84ab6b52009b008ace23b1a3fb20aef3
echo "this-is-a-test-value-12345" | npx wrangler secret put TEST_BINDING --name junglegym
```

This sets a Worker secret binding on the deployed `junglegym` Worker immediately — no redeploy needed. Output should say `Success! Uploaded secret TEST_BINDING`.

### 1d. Verify the test binding shows up via process.env

```bash
curl -s https://junglegym.academy/api/debug/env-bindings | jq '.env.TEST_BINDING'
```

**Expected (success):** `{"present": true, "length": 25, "prefix": "this-i"}` — **this proves OpenNext wires Worker bindings into process.env at runtime.** Migration can proceed.

**If `present: false`:** OpenNext is NOT reading Worker bindings into process.env in this repo's version. Options:
- Upgrade `@opennextjs/cloudflare` (check changelog for runtime env changes)
- Use the `getCloudflareContext()` helper from OpenNext directly in code that needs secrets (more invasive — would require touching `lib/stripe.ts` and `lib/supabase/server.ts`)
- Abandon the migration and document the pattern more clearly as the permanent approach

Do not proceed past this step without a `present: true` result.

### 1e. Clean up the test binding

```bash
npx wrangler secret delete TEST_BINDING --name junglegym
```

---

## Step 2: Migrate SUPABASE_SERVICE_ROLE_KEY (easiest to verify)

This one is safest to migrate first because the admin panel is easy to test end-to-end, and if it breaks, the blast radius is limited to admin users (just Davin + Rye).

### 2a. Set the secret via wrangler

Get the value from Supabase dashboard → Project Settings → API → Service role key. Then:

```bash
export CLOUDFLARE_ACCOUNT_ID=84ab6b52009b008ace23b1a3fb20aef3
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name junglegym
# paste the service role key when prompted
```

Verify it's set:
```bash
npx wrangler secret list --name junglegym
# should show SUPABASE_SERVICE_ROLE_KEY
```

### 2b. Test that the binding is live WHILE the bundle fallback still exists

At this point the secret is in BOTH places — the Worker binding AND the bundled .env.local. Test the admin panel. It should still work (precedence doesn't matter as long as both values are the same). If it breaks, the Worker binding is doing something unexpected and we need to stop.

### 2c. Remove SUPABASE_SERVICE_ROLE_KEY from the .env.local hack

Edit `apps/web/next.config.js` to remove `SUPABASE_SERVICE_ROLE_KEY` from the `SERVER_SECRETS` array.

Edit `.github/workflows/deploy.yml` to remove the `SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}` line from the "Build for Cloudflare" env block.

Commit + push. Wait for deploy.

### 2d. Test the admin panel again

Now the only place `SUPABASE_SERVICE_ROLE_KEY` exists at runtime is the Worker binding. If admin panel still works, the binding path is fully validated for this secret. If it breaks:
- First fallback: re-add to SERVER_SECRETS + deploy.yml and rollback
- Then investigate why the binding path didn't take over

### 2e. Optional — delete the GH Actions secret

```bash
gh secret delete SUPABASE_SERVICE_ROLE_KEY
```

Only do this once you're 100% confident. Leaving it as an orphan is harmless.

---

## Step 3: Migrate STRIPE_SECRET_KEY

Same shape as Step 2. Test by running a full checkout with Stripe test card `4242 4242 4242 4242` after removing from the bundle.

```bash
export CLOUDFLARE_ACCOUNT_ID=84ab6b52009b008ace23b1a3fb20aef3
npx wrangler secret put STRIPE_SECRET_KEY --name junglegym
# paste sk_test_... or sk_live_... matching current mode
```

Then:
- Remove `STRIPE_SECRET_KEY` from `SERVER_SECRETS` in next.config.js
- Remove `STRIPE_SECRET_KEY` line from deploy.yml env block
- Commit + push + test checkout end to end

---

## Step 4: Migrate STRIPE_WEBHOOK_SECRET

Same shape. Hardest to smoke-test because it requires Stripe actually firing a webhook at the endpoint. Options:
- Use Stripe dashboard → Webhooks → "Send test event" to fire a dummy `payment_intent.succeeded` — check the Worker tail for the log showing the webhook was verified or rejected
- OR run an actual test purchase and verify both the webhook path and the redirect-confirm path create purchases idempotently

```bash
export CLOUDFLARE_ACCOUNT_ID=84ab6b52009b008ace23b1a3fb20aef3
npx wrangler secret put STRIPE_WEBHOOK_SECRET --name junglegym
# paste whsec_... from Stripe dashboard → Developers → Webhooks → endpoint → Signing secret
```

Then remove from next.config.js + deploy.yml + commit + push + test.

---

## Step 5: Final cleanup

Once all three are migrated:

### 5a. Delete the SERVER_SECRETS block entirely from next.config.js

It should look like the original pure Next.js config (no `fs` import, no SERVER_SECRETS array). Clean up comments.

### 5b. Delete the debug endpoint

```bash
rm apps/web/src/app/api/debug/env-bindings/route.ts
```

### 5c. Update CLAUDE.md

Replace the Deployment section's "Server-side vars → `.env.local` smuggling" sub-section with the much simpler "Server-side vars → `wrangler secret put --name junglegym`" description. Add a change-log entry.

### 5d. Delete this runbook

```bash
rm docs/worker-secrets-migration.md
```

### 5e. Commit final cleanup, open PR, merge

```bash
git add -A
git commit -m "cleanup: remove .env.local secret smuggling, finalize Worker bindings migration"
git push
gh pr create --base main --title "Worker secrets cleanup: migrate to wrangler secret put"
```

---

## Step 6 (bonus): non-secrets cleanup while we're here

Optional but recommended — these have been pending since 2026-04-08:

1. **Delete the vestigial `junglegym-web` Pages project** or at minimum disconnect its GitHub integration so it stops wasting build minutes on dead deploys
2. **Rename `deploy.yml` → `deploy-production-worker.yml`** with a top-of-file comment noting it's the only real production deploy path
3. **Add a comment in `apps/web/wrangler.toml`** pointing at the Deployment section in CLAUDE.md
4. **Add a `npm run secrets:list` script** to apps/web/package.json that runs `wrangler secret list --name junglegym` — makes the secret store easy to query

---

## Rollback

If something goes catastrophically wrong mid-migration:

```bash
git checkout main
git reset --hard <last-known-good-commit-sha>
git push --force origin main  # only if main is already broken
```

Or more surgically, revert the specific commit that broke things:
```bash
git revert <sha>
git push
```

Worker secrets set via `wrangler secret put` persist across rollbacks — they only go away if you explicitly `wrangler secret delete`. So a rollback of the code doesn't undo the secret setting; you can leave the secrets in place and come back to the migration later.
