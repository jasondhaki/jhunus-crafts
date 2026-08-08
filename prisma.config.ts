import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --env-file=.env.local prisma/seed.ts",
  },
  // CLI/migrate operations (migrate dev, db push, introspect) need the direct,
  // unpooled connection — Neon's pooled DATABASE_URL doesn't support the
  // session-level features schema migrations rely on. The app's runtime
  // PrismaClient connects separately via the pooled URL through a driver
  // adapter (see src/lib/db.ts), so this only affects the CLI.
  datasource: {
    url: process.env["DIRECT_URL"],
    // Only used by commands that need to replay migration history to
    // determine a resulting schema (`migrate dev`, `migrate diff
    // --from-migrations`) — undefined in normal local/CI runs that don't
    // touch migration history, so leaving this unset doesn't break anything.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
