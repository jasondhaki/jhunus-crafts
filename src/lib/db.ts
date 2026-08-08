import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Neon's adapter connects over WebSocket (needed for Prisma's interactive
// transactions, which the plain HTTP driver can't support). Node.js doesn't
// always expose a global WebSocket, so we wire the `ws` package explicitly.
neonConfig.webSocketConstructor = ws;

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Next.js dev-mode hot reload re-evaluates modules on every change; without
// caching on `globalThis`, each reload would spin up a new PrismaClient (and
// a new connection pool) instead of reusing one across reloads.
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
