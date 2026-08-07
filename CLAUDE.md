@AGENTS.md

# Jhunu's Crafts — Project Constitution

This file is the binding contract for every session working on this project. Rules here are not suggestions — treat them as requirements, and flag any conflict rather than resolving it silently.

## Project

Jhunu's Crafts — an artisanal e-commerce storefront selling handcrafted jute bags, holders, and home goods. Brand feeling: natural warmth, hand-woven quality, tactile authenticity. Products are framed like museum artifacts: minimal structure, organic earth tones, generous whitespace.

## Stack (do not substitute without asking)

Next.js App Router + TypeScript, Tailwind CSS, PostgreSQL + Prisma, Auth.js v5 (`next-auth@beta`), Stripe (Payment Intents + webhooks), Zustand for cart, Cloudinary for media, Vercel for hosting.

**Environment specifics (as scaffolded):** Next.js 16.3.0, React 19.2.8, Tailwind CSS 4.3.3, TypeScript 5.9.3. Tailwind is v4 — there is **no** `tailwind.config.ts`/`.js`. Theme tokens (colors, fonts, spacing) live in CSS via `@theme` blocks in `src/app/globals.css`, not in a JS/TS config file. Next.js 16 has breaking changes versus older training data — consult `AGENTS.md` (auto-maintained by `next dev`) before writing framework-specific code.

## Non-negotiable engineering rules

1. **MONEY**: all monetary values are stored and passed around as INTEGER CENTS (`Int`), never floats, never Prisma `Decimal` crossing a Server→Client boundary. Format only at the render edge via a single `formatPrice(cents: number)` helper in `src/lib/money.ts`. Rationale: Prisma `Decimal` is not serializable to Client Components and float math produces rounding errors on totals.
2. **PRICE AUTHORITY**: the client NEVER sends a price. Server recomputes every total from the database by product ID before creating a Payment Intent. Treat any client-supplied amount as hostile.
3. **STOCK**: never read-then-write. Deduct with a single conditional atomic statement (`updateMany` with `where: { id, stock: { gte: qty } }`) inside a transaction, and assert the returned count. Overselling a one-of-a-kind handcrafted item is a business-critical bug.
4. **FULFILLMENT**: an order becomes PAID only in the Stripe webhook handler, never from a client-side confirmation callback or a redirect. The success page is cosmetic.
5. **SERVER FIRST**: default to Server Components. Add `"use client"` only for genuine interactivity (cart drawer, filters, image zoom, Stripe Element). Never fetch data in a Client Component when a Server Component can pass it down.
6. **VALIDATION**: every Server Action and route handler validates input with a zod schema at the boundary before touching the database.
7. **AUTHZ**: every `/admin` route and every admin Server Action independently re-checks `session.user.role === "ADMIN"` server-side. Middleware and hidden UI are conveniences, not security.
8. **SECRETS**: never write a real credential into any tracked file. Read config from `process.env` only.
9. **ERRORS**: no swallowed catch blocks. Either handle meaningfully or let it throw to an error boundary.

## Git workflow (follow every time)

- One branch per phase: `phase-1-foundation`, `phase-2-storefront`, `phase-3-payments`, `phase-4-dashboards`.
- Conventional Commits: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`.
- Commit at every working checkpoint, not just at the end of a task. Small commits.
- Before every commit run: `npm run lint && npm run typecheck && npm run build`. If any fail, fix before committing.
- At the end of each phase: push the branch, open a PR with `gh pr create`, and write a PR body listing what shipped, what was deliberately deferred, and how to test it manually.
- Never force-push main.

## Design tokens

- Warm Parchment `#FBF9F5` — page background
- Off-White Cream `#FFFDF9` — cards, inputs
- Deep Natural Jute `#8C6D46` — sub-headers, borders, active filter tags
- Terracotta Clay `#A35A38` — primary CTAs, sale tags, warnings
- Charcoal Bark `#2C2825` — body text, high-contrast titles, dark buttons

Headings: Playfair Display (serif, editorial). Body/UI: Plus Jakarta Sans.

Motion: Framer Motion, subtle and slow — 200-400ms ease-out. No bouncy or playful springs; the brand is calm and tactile. Respect `prefers-reduced-motion`.

## Directory conventions

`src/app` (routes), `src/components/ui` (primitives), `src/components/shop`, `src/components/admin`, `src/lib` (db, auth, stripe, money, utils), `src/actions` (Server Actions), `src/store` (Zustand), `prisma/`.

## Working style with me

- If a requirement in a prompt conflicts with a rule here, stop and flag it instead of silently picking one.
- If you're about to install a new dependency not listed above, ask first.
- Prefer boring, well-documented solutions over clever ones.
- When you finish a task, end with: what you built, what you deliberately left out, and the single riskiest thing you'd want reviewed.
