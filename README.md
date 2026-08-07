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

## Phases

- [x] **Phase 1 — Scaffolding**: Next.js + TypeScript + Tailwind + core dependencies, env template, CI, GitHub repo.
- [ ] **Phase 2 — Data & catalog**: Prisma schema, product catalog, admin content model.
- [ ] **Phase 3 — Commerce**: Cart, checkout, Stripe payments, order management, auth.
- [ ] **Phase 4 — Polish & launch**: Performance, SEO, animations, production deploy.
