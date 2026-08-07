@AGENTS.md

# Jhunu's Crafts — project notes

## Installed versions (Phase 1 scaffold, 2026-08-08)

- next: 16.3.0
- react / react-dom: 19.2.8
- tailwindcss: 4.3.3
- typescript: 5.9.3

## Tailwind v4 — no tailwind.config.ts

This project uses **Tailwind CSS v4**. There is no `tailwind.config.ts`/`.js` file, and none should be added for theme tokens. Theme customization (colors, fonts, spacing, etc.) goes in CSS via `@theme` blocks in `src/app/globals.css`, using the `@import "tailwindcss";` + `@theme { ... }` pattern. PostCSS is configured via `@tailwindcss/postcss` in `postcss.config.mjs`.

## Next.js 16 note

Next.js 16 has breaking changes relative to older training data. See `AGENTS.md` (auto-generated/maintained by `next dev`) and `node_modules/next/dist/docs/` before writing framework-specific code.
