# Jhunu's Crafts

A production e-commerce storefront for handcrafted jute products — bags, holders, and home goods. Built on Next.js App Router with a Prisma-backed catalog, Stripe checkout, and NextAuth-based accounts, styled with Tailwind CSS.

## Tech stack

| Layer            | Choice                                      |
| ----------------- | -------------------------------------------- |
| Framework         | Next.js 16 (App Router, `src/` dir)          |
| Language          | TypeScript                                   |
| Styling           | Tailwind CSS v4 (CSS-based `@theme`, no `tailwind.config.ts`) |
| State             | Zustand                                      |
| Validation        | Zod                                          |
| Database ORM      | Prisma (`@prisma/client`)                    |
| Auth              | NextAuth (`next-auth@beta`) + `@auth/prisma-adapter` |
| Payments          | Stripe (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`) |
| Images            | Cloudinary                                   |
| Animation         | Framer Motion                                |
| Icons             | lucide-react                                 |
| Testing           | Vitest + Testing Library + jsdom             |
| CI                | GitHub Actions                               |

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` (already done in this repo as a starting point) and fill in real values:
   ```bash
   cp .env.example .env.local
   ```
   Required keys: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

3. **Push the database schema**
   ```bash
   npm run db:push
   ```

4. **Seed the database**
   ```bash
   npm run db:seed
   ```

5. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app serves at [http://localhost:3000](http://localhost:3000).

Other useful scripts: `npm run typecheck`, `npm run test`, `npm run db:migrate`, `npm run db:studio`, `npm run lint`, `npm run build`.

## Testing the Stripe webhook locally

`POST /api/webhooks/stripe` (`src/app/api/webhooks/stripe/route.ts`) is where an order actually
becomes `PAID` and stock is deducted — it only trusts requests carrying a valid Stripe signature,
so exercising it end-to-end requires the [Stripe CLI](https://docs.stripe.com/stripe-cli), not a
plain `curl`.

1. **Install and authenticate the CLI** (one-time):
   ```bash
   stripe login
   ```

2. **Forward events to your local dev server.** Run this in its own terminal, alongside `npm run
   dev`:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   The CLI prints a webhook signing secret (`whsec_...`) the moment it starts — copy that into
   `STRIPE_WEBHOOK_SECRET` in `.env.local` and restart `npm run dev` so the route picks it up.
   This is a *different* secret than the one on your Stripe Dashboard's webhook settings; the CLI
   mints one scoped to this forwarding session.

3. **Trigger a synthetic event** without going through a real checkout:
   ```bash
   stripe trigger payment_intent.succeeded
   ```
   This fires a `payment_intent.succeeded` event with Stripe-generated fake data. Since it won't
   reference a real order in your database, expect (and look for) the route's "no matching order"
   log line — that confirms signature verification and idempotency claiming both worked; it's not
   a failure.

4. **For a real end-to-end run** (the version that actually deducts stock), go through
   `/checkout` in the browser with a real cart and Stripe's test card `4242 4242 4242 4242`, any
   future expiry, any CVC, and any postal code. The PaymentIntent created by `/api/checkout` will
   reference a real order, so `stripe listen` forwarding its `payment_intent.succeeded` event will
   drive the full path: stock decrement, `status → PAID`, and the `/checkout/success` page's
   polling should resolve.

5. **Replay a specific event** (useful for reproducing an idempotency or oversell scenario) by
   grabbing its id from the `stripe listen` output and running:
   ```bash
   stripe events resend evt_...
   ```
   Sending the same event id twice in a row is exactly how to confirm the duplicate-event
   short-circuit (step 3 in the route) is actually working, not just unit-tested.

## Phases

- [x] **Phase 1 — Scaffolding**: Next.js + TypeScript + Tailwind + core dependencies, env template, CI, GitHub repo.
- [ ] **Phase 2 — Data & catalog**: Prisma schema, product catalog, admin content model.
- [ ] **Phase 3 — Commerce**: Cart, checkout, Stripe payments, order management, auth.
- [ ] **Phase 4 — Polish & launch**: Performance, SEO, animations, production deploy.
