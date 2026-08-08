# Security Audit — Pre-Launch

Performed as the final pass before launch. Every finding below was verified directly (grep across
source and full git history, or live against the real dev database with a real authenticated
session) — this is not a self-assessment written from memory of what the code is supposed to do.

## 1. No client-supplied price ever reaches Stripe

**Status: PASS.**

There is exactly one call site in the codebase that sets a Stripe monetary amount:
`src/app/api/checkout/route.ts`, `stripe.paymentIntents.create({ amount: totalCents, ... })`.

Traced `totalCents` back to its source:

- `totalCents = draft.subtotalCents + shippingCents`
- `draft` comes from `buildOrderDraft(items, products)` (`src/lib/checkout-order.ts`), which computes
  `subtotalCents` from `product.priceCents` — and `products` is a **fresh `db.product.findMany()`
  read**, not client input.
- `shippingCents` comes from `getShippingMethod(shippingMethodId)` — the client sends a
  `shippingMethodId` *string*, but the cents value is looked up from a hardcoded server-side config
  object (`src/lib/shipping.ts`); the client cannot supply an arbitrary shipping cost.
- `checkoutRequestSchema` (`src/lib/checkout-schemas.ts`) — the zod schema validating the request
  body — has **no price/amount field at all**. The client physically cannot submit a price; there's
  no field for zod to even accidentally pass through.

Also grepped the entire `src/` tree for any other place a `*Cents` field is read directly from
`formData` (the pattern that would indicate a client-trusted dollar amount bypassing `toCents()`):
zero matches. The admin product form's price field goes through `toProductData()`
(`src/lib/admin/product-schema.ts`), which converts the validated dollar amount via `toCents()`
server-side — same discipline as checkout.

The only other Stripe write call in the codebase is the webhook's oversell-recovery refund path
(`src/app/api/webhooks/stripe/route.ts`), which is currently a stub (logs what it would do; no live
`stripe.refunds.create()` call exists yet).

## 2. Every /admin route and action calls `requireAdmin()`

**Status: PASS.**

- All 9 files under `src/app/admin/**` (`layout.tsx` + 8 `page.tsx`s) call `requireAdmin()`.
- All 15 exported Server Actions across `src/actions/admin/*.ts` (products: 6, categories: 3,
  orders: 1, reviews: 3, cloudinary: 2) call `requireAdmin()` as their first statement, verified
  individually, not just "the file contains the string somewhere."
- Verified **live** with real sessions against the real dev database: an unauthenticated request to
  `/admin` returns `307 → /login`; an authenticated `CUSTOMER`-role session gets a real `403
  Forbidden`; an `ADMIN`-role session gets `200`.

This matters because `src/middleware.ts`'s route protection only covers page navigations — a Server
Action is a POST to the same URL and can be invoked directly (e.g. from a crafted request) bypassing
any UI that would normally hide the button. Every action re-checking independently is what actually
closes that gap, not the middleware.

## 3. Every /account query is scoped by `session.user.id`

**Status: PASS**, with one intentional, disclosed exception outside `/account`.

- All 7 files under `src/app/account/**` call `requireUser()` and pass `user.id` into every query
  (directly, or via `src/lib/order-query.ts` / `src/lib/wishlist-query.ts` / `src/lib/address-query.ts`,
  which take `userId` as a required parameter and put it in the Prisma `where` clause).
- `src/actions/account.ts`, `src/actions/reorder.ts`, and the authenticated paths in
  `src/actions/wishlist.ts` all scope every mutation by `user.id` from `requireUser()`.
- `getOrderForUser(userId, orderNumber)` puts `userId` **in the query itself**
  (`where: { orderNumber, userId }`), not as a post-fetch filter — so an order that exists but
  belongs to someone else produces the exact same `null` as an order number that doesn't exist at
  all. The page calls `notFound()` either way, never `403` (a `403` would itself confirm "yes, this
  is a real order, just not yours"). Verified live: fetched another real user's order number through
  a real authenticated session and diffed the HTTP response byte-for-byte against a request for a
  fabricated order number — identical.

**Documented exception**: `getOrderStatus()` (`src/actions/order.ts`), used by `/checkout/success`
(not `/account`), looks up an order by `orderNumber` alone with no ownership check. This is
intentional — guest checkout has no `session.user.id` to scope by — and mitigated by the order
number being an 8-character code from a 33-character alphabet (see `src/lib/order-number.ts`), which
is not meaningfully enumerable. It also returns only `{ orderNumber, status, email, totalCents,
createdAt }` — never the shipping address or line items. Flagging this explicitly as a reviewed
tradeoff rather than an oversight.

## 4. Rate limiting

Added `src/lib/rate-limit.ts` (fixed-window, in-memory) and wired it into:

| Endpoint | Limit | Rationale |
| --- | --- | --- |
| `POST /api/checkout` | 10 / min / IP | Creates a real Stripe PaymentIntent + DB row per call |
| `loginAction` | 5 / min / IP | Credential-stuffing / brute-force target |
| `registerAction` | 5 / min / IP | Scripted account creation + bcrypt CPU cost per attempt |

**KNOWN LIMITATION — read before relying on this in production.** This rate limiter's state lives in
the memory of a single serverless execution environment. On Vercel, concurrent requests can land on
different instances that don't share this `Map`, and instances get recycled — so this does **not**
enforce a hard global limit in production. It's a genuine first line of defense against a single
script hammering one warm instance, not a substitute for a shared store. **Before real launch
traffic, replace this with Upstash Redis + `@upstash/ratelimit`** (sliding window, actually shared
across instances — available via the Vercel Marketplace). Shipping the in-memory version now rather
than blocking on provisioning a new external dependency for this pass, but this is the single
highest-priority follow-up in this document.

## 5. Security headers (`next.config.ts`)

Added via `headers()`:

- `X-Frame-Options: DENY` — this storefront never needs to be framed, by anyone, including itself.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — none of these are used anywhere.
- `Content-Security-Policy` — `default-src 'self'`, explicitly allowing `js.stripe.com` (script +
  frame, for the Payment Element), `api.stripe.com` **and `api.cloudinary.com`** (connect — see
  below), `res.cloudinary.com` and `images.unsplash.com` (images), `frame-ancestors 'none'`,
  `object-src 'none'`. `script-src` and
  `style-src` still include `'unsafe-inline'` — a stricter **nonce-based CSP** (generating a
  per-request nonce in middleware and threading it through `<Script>`/inline styles) is real
  additional hardening not done in this pass; documenting it here rather than silently shipping a
  weaker policy without saying so. `'unsafe-eval'` is added **only** in development (Next's Fast
  Refresh needs it) and is never present in the production policy.

  **Self-inflicted bug found and fixed during this same pass**: the CSP was initially written with
  only `res.cloudinary.com` (the image-*delivery* domain) in `connect-src`. Cloudinary's *upload* API
  lives on a different host, `api.cloudinary.com` — so the very first end-to-end run of the admin
  product-image-upload E2E spec showed the browser itself silently blocking the real upload request
  with a CSP violation (visible only in the browser console, not as a network or server error). Fixed
  by adding `api.cloudinary.com` to `connect-src`. Left here as a reminder that a security header
  change needs the same "actually run it" verification as any other change — it shipped broken on
  the first pass, and nothing short of exercising the real upload flow would have caught it.

## 6. Git history secret scan

**Status: CLEAN.** Searched the **entire history**, not just the working tree:

- `.env` / `.env.local` / `.env.*.local` were **never committed**, at any point in history
  (`git log --all --full-history -- .env .env.local` — empty).
- `.env.example` has contained only blank placeholder keys (`DATABASE_URL=`, etc.) since its very
  first commit — diffed every historical version, never a real value.
- Grepped every diff in `git log --all -p` for Stripe (`sk_live_`, `sk_test_`, `whsec_`), Google
  (`AIza...`), GitHub (`ghp_`, `github_pat_`), AWS (`AKIA...`) key shapes, and PEM private key
  blocks — zero matches anywhere in history.
- Specifically searched for the actual real Neon database password currently in the untracked
  `.env.local` on this machine, in case it had ever leaked into a commit that was later reverted —
  zero matches.
- Searched for any non-placeholder `postgres://user:pass@host` connection string in any diff —
  zero matches (the only hits are the intentionally-fake `user:password@localhost` dummy used by
  CI, and `.github/workflows/ci.yml`'s equally-fake `STRIPE_SECRET_KEY: "sk_test_dummy"`).

No secrets were found. Per instructions, if this check had turned up a real credential the correct
response would have been to stop immediately and report it before doing anything else — that
condition was not met.

## Summary

| Item | Status |
| --- | --- |
| No client-supplied price reaches Stripe | ✅ Pass |
| Every /admin route + action calls `requireAdmin()` | ✅ Pass (15/15 actions, 9/9 pages) |
| Every /account query scoped by session user id | ✅ Pass (1 disclosed, reasoned exception outside /account) |
| Rate limiting on checkout/login/register | ✅ Shipped, ⚠️ in-memory only — see limitation above |
| Security headers incl. CSP | ✅ Shipped |
| Git history secret scan | ✅ Clean |

**Before real production traffic**, in priority order:
1. Replace the in-memory rate limiter with Upstash Redis (shared across instances).
2. Consider a nonce-based CSP to drop `'unsafe-inline'` from `script-src`.
3. Implement the webhook's refund stub for real before relying on the oversell-recovery path.
