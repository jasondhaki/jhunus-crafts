# E2E tests (Playwright)

```bash
npx playwright install chromium   # one-time
npx playwright test               # runs against a dev server on :3100 (auto-started)
```

## What's real vs. what's boundary-tested here

This sandbox has no real Stripe test-mode account and no real Cloudinary account. Rather than mock
those SDKs (which would mean the tests exercise fake code, not the real integration), each spec is
split at the actual credential boundary:

- **Stripe**: `playwright.config.ts` injects a syntactically-valid-but-fake `STRIPE_SECRET_KEY` and
  a **real, matching** `STRIPE_WEBHOOK_SECRET` (`e2e/helpers.ts`'s `E2E_STRIPE_WEBHOOK_SECRET`) into
  the dev server it drives — never into `.env.local`. This means:
  - `POST /api/checkout` runs for real up through validation, stock check, and PENDING-order
    creation, and only fails at the live Stripe API call (invalid key → rejected). The checkout spec
    confirms this fails *predictably* (a real error message, not a crash).
  - The **webhook** — the part that actually matters for "→ order PAID" and the oversell guarantee —
    is exercised for real: a PENDING order is created directly (the same shape `/api/checkout` would
    have produced), and a `payment_intent.succeeded` event is signed with the real
    `HMAC-SHA256(secret, "{timestamp}.{payload}")` scheme (the same one `stripe listen`/`stripe
    trigger` use) and POSTed to the real route. Signature verification, the idempotency guard, and
    the atomic stock-decrement transaction all run for real.
- **Cloudinary**: same pattern — fake-but-valid credentials so `createUploadSignature()` (a pure
  local HMAC, no network call) succeeds for real, then the actual upload POST to
  `api.cloudinary.com` is intercepted via `page.route()` and given a mocked response. Everything on
  our side of that boundary (the signature action, `FormData` construction, response parsing,
  reorderable thumbnail state) runs for real.

**Before this suite is trustworthy in CI against a real Stripe/Cloudinary test account**, replace the
placeholder env values in `playwright.config.ts` with real test-mode credentials (as GitHub Actions
secrets) and drop the `page.route()` mock in `admin-product-to-shop.spec.ts` — at that point the
checkout spec should be extended to actually fill Stripe's Payment Element and assert a real `PAID`
transition end-to-end, which is closer to what item 2 originally asked for than what's achievable
without those credentials.
