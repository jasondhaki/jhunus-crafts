# Deployment Guide

## Environment variables

All required variables are listed (unset) in `.env.example`. Set every one
of these in the Vercel project's Environment Variables settings for
**Production** (and separately for **Preview**, with test-mode Stripe keys —
never share live Stripe keys into Preview deployments).

| Variable | Source | Notes |
|---|---|---|
| `DATABASE_URL` | Neon dashboard → connection string (pooled) | Used by the Neon serverless driver adapter (`src/lib/db.ts`) — must be the pooled connection string, not the direct one. |
| `DIRECT_URL` | Neon dashboard → connection string (direct/unpooled) | Prisma Migrate needs a direct connection; used only for migrations, not runtime queries. |
| `AUTH_SECRET` | Generate with `npx auth secret` | Auth.js v5 session/JWT signing key. Rotating it invalidates every existing session. |
| `AUTH_URL` | Your production domain, e.g. `https://jhunuscrafts.com` | Must match exactly, including scheme — a mismatch breaks OAuth redirect callbacks (see the `AUTH_URL` bug documented in this same launch-hardening pass, where a Playwright dev server on a different port silently redirected to the wrong origin). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Client | Authorized redirect URI must be `{AUTH_URL}/api/auth/callback/google`. |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys | Live secret key (`sk_live_...`) for Production; test key (`sk_test_...`) for Preview. |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Developers → Webhooks → your endpoint → Signing secret | See "Webhook registration" below — this is generated per-endpoint, not per-account. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard, same page as the secret key | Public by design (ships to the browser) — still scope it to the matching live/test mode. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary dashboard → Settings → API Keys | Used server-side only (`src/lib/cloudinary.ts` and the admin product-image upload flow) — never exposed to the client per CLAUDE.md rule 8. |

Never commit real values for any of these — `.env.local` is gitignored;
`.env.example` stays empty on the right-hand side by design.

## Production webhook endpoint registration

The webhook handler (`src/app/api/webhooks/stripe/route.ts`) is the *only*
place an order is ever marked `PAID`, per CLAUDE.md rule 4 — the success
page is cosmetic. Registering it correctly is not optional:

1. In the Stripe dashboard (live mode), go to **Developers → Webhooks → Add
   endpoint**.
2. Endpoint URL: `https://<your-production-domain>/api/webhooks/stripe`.
3. Subscribe to exactly these events (the handler switches on `event.type`
   and acknowledges-but-ignores anything else, so subscribing to more just
   adds noise, not risk):
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy the **Signing secret** shown after creation (`whsec_...`) into the
   `STRIPE_WEBHOOK_SECRET` environment variable in Vercel, then redeploy —
   env var changes don't apply to already-running deployments.
5. Send a test event from the dashboard's endpoint page and confirm a `200`
   in both Stripe's delivery log and Vercel's function logs before
   considering the endpoint live.

If the domain ever changes (custom domain migration, staging → prod
cutover), the webhook endpoint URL must be updated in Stripe manually — it
does not follow Vercel's automatic domain aliasing.

## Migration strategy

- **Local development**: `npm run db:migrate` (`prisma migrate dev`) —
  creates and applies a new migration file, safe to use interactively.
- **CI / production**: `npx prisma migrate deploy` — applies pending
  migration files without generating new ones or prompting; this is what
  the `e2e` job in `.github/workflows/ci.yml` runs against a disposable Neon
  branch, and what should run against the production database before a
  release that includes schema changes.
- **Ordering**: run migrations *before* deploying the new application code,
  not after and not concurrently. A migration that only adds (a new
  column, a new table) is safe to run ahead of code that doesn't reference
  it yet. A migration that removes or renames a column used by code
  currently in production is not safe to run this way — split it into an
  additive migration (deploy code that stops using the old column) followed
  by a separate cleanup migration in a later release, rather than one
  migration that does both.
- **Neon branching for schema changes you're unsure about**: create a Neon
  branch from production, run the migration against the branch, verify the
  app works against it, then apply the same migration to production
  directly. The `neondatabase/create-branch-action` used in CI (see
  `ci.yml`) is the same mechanism, automated per-run for E2E isolation.
- Prisma tracks applied migrations in the `_prisma_migrations` table in the
  database itself — `migrate deploy` is safe to run repeatedly; it only
  applies what hasn't been applied yet.
- **Avoid `prisma db push` against any database that also gets migrations**
  (i.e. the dev database, and definitely production). `db push` writes
  schema changes directly with no migration file — which is exactly how
  `OrderStatusEvent` ended up in the dev database with nothing in
  `prisma/migrations` to show for it (fixed in
  `20260808180435_add_order_status_event_and_drift`). `db push` is fine
  against a genuinely disposable database (a scratch Neon branch you're
  about to throw away) but never against one that migration history is
  supposed to describe. The `schema-drift-check` CI job (below) exists
  specifically to catch a recurrence of this.

## Rollback procedure

**Application code:**
1. Vercel keeps every previous deployment. In the Vercel dashboard →
   Deployments, find the last known-good deployment and use **Promote to
   Production** — this is effectively instant (it repoints the production
   alias, no rebuild) and is the fastest way to stop the bleeding.
2. If deploying from CI (the `deploy` job in `ci.yml`), the equivalent is
   `git revert` the offending commit(s) on `main` and let CI redeploy — do
   this in parallel with the dashboard promotion above rather than waiting
   for it, since the dashboard promotion is faster.

**Database migrations:**
- Prisma does not auto-generate a "down" migration. Roll back schema
  changes by writing and applying a new forward migration that undoes the
  change (e.g. re-adding a dropped column) — never hand-edit
  `_prisma_migrations` or run destructive SQL directly against production
  without a fresh Neon branch to test it on first.
- This is exactly why the migration strategy above insists on additive
  migrations for anything touching a column/table still in active use: an
  additive migration's rollback is just "roll back the app code," with no
  matching schema rollback required at all.
- If a bad migration already ran and is actively breaking production,
  prefer a Neon **point-in-time restore** (dashboard → your project →
  Restore) to a timestamp just before the migration, over attempting to
  hand-write a corrective migration under pressure.

**Stripe webhook safety during rollback:** rolling back application code
does not roll back Stripe. If the previous deployment's webhook handler
logic differs from what's currently registered, any events Stripe already
queued for retry will be delivered to whichever code is live when they
land — the idempotency layer in the webhook handler (event-id claim via
`ProcessedWebhookEvent`, plus the second `order.status === "PAID"` check)
is what makes this safe either way, not the rollback itself.

## CI/CD

`.github/workflows/ci.yml` runs four jobs on every push/PR to `main`:

1. **`build`** — install, `prisma generate`, lint, typecheck, unit tests
   (`npm test`), `next build`. Always runs, no external secrets required.
2. **`e2e`** — provisions a disposable Neon branch, applies migrations,
   seeds it, runs the full Playwright suite (`e2e/*.spec.ts`) against it,
   and deletes the branch afterward. Requires `NEON_API_KEY` and
   `NEON_PROJECT_ID` repo secrets (Neon dashboard → Account → API Keys, and
   the project settings page for the project ID); skips its steps cleanly
   (green, no-op) if they're not configured, so this doesn't block anyone
   who hasn't wired it up yet.
3. **`schema-drift-check`** — provisions its own disposable Neon branch,
   builds it from `prisma/migrations` alone (`migrate deploy`, nothing else),
   then diffs the result against `prisma/schema.prisma`
   (`migrate diff --from-config-datasource --to-schema ... --exit-code`). A
   non-empty diff fails the build — this is what catches the next `db push`
   (or any other out-of-band change) drifting ahead of migration history
   before it becomes another silent gap like the one fixed by
   `prisma/migrations/20260808180435_add_order_status_event_and_drift`.
   Same `NEON_API_KEY`/`NEON_PROJECT_ID` gating as `e2e`.
4. **`deploy`** — only on a push to `main`, only after `build`, `e2e`, and
   `schema-drift-check` all pass. Requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
   `VERCEL_PROJECT_ID` repo secrets (Vercel dashboard → Account Settings →
   Tokens for the token; `npx vercel link` locally reveals the org/project
   IDs in `.vercel/project.json`). Skips cleanly if unset — if Vercel's own
   Git integration is connected to this repo instead, leave this unset and
   let Vercel deploy on its own; don't run both, or every `main` push
   double-deploys.

### Local drift check

The same check can be run locally against any real database without
provisioning a Neon branch, by pointing `DIRECT_URL` at it directly:

```
DIRECT_URL="<url of a db built from migrations only>" \
  npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

Exit code `0` means no drift, `2` means real drift (something changed the
database outside of `prisma migrate`), `1` means the command itself failed.
